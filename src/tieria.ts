import { readFileSync, existsSync  } from 'fs';
import path from 'path';
import { createServer } from 'tls'
import { responseFromFile, responseInput, response, responseSlowDown } from './tieria/response'
import { StatusCode } from './tieria/status_codes';
import { erde } from './tieria/erde';

class Tieria {
    CONFIG: any;
    SERVER: any;
    PUBLIC_DIR: string;
    sessions: any[];

    constructor() {
        // read config files
        this.CONFIG = JSON.parse(readFileSync(path.resolve(__dirname, './tieria.json')).toString());
        // establish public directory
        this.PUBLIC_DIR = path.resolve(__dirname, '../' + this.CONFIG['directory']);
        // read certificates
        const CERTS = {
            key: readFileSync(path.resolve(__dirname, '../cert/key.pem')),
            cert: readFileSync(path.resolve(__dirname, '../cert/cert.pem')),
            //rejectUnauthorized: false,
        };
        this.sessions = new Array();
        // create server
        this.SERVER = createServer(CERTS, (socket) => {
            socket.on('data', (data) => {

                // check rate limit
                // if the session already exists
                const session = this.sessions[socket.localAddress];
                if (session != undefined) {
                    // check when the last request came
                    // if it was earlier than the defined rate config
                    if ((new Date().valueOf() - session) < this.CONFIG['rate']) {
                        // end the socket and send slowdown
                        socket.write(responseSlowDown());
                        socket.end();
                        return;
                    }
                }

                // check if redirect is enabled
                if (this.CONFIG.redirect.enabled) {
                    if (this.CONFIG.redirect.permanent) {
                        socket.write(response(StatusCode.RedirectPermanent, this.CONFIG.redirect.link).toString());
                    } else {
                        socket.write(response(StatusCode.RedirectTemporary, this.CONFIG.redirect.link).toString());
                    }
                    socket.end();
                    return;
                }

                const url = data.toString();
                // remove input from url
                const query = url.slice(url.indexOf('?')+1);

                // extract path
                const path_delim: number = url.indexOf('/', 10);
                let url_path = url.slice(path_delim, url.indexOf('?')).trimEnd();

                // if path is empty or does not point to a .gmi file, default to index.gmi
                if (url_path === '/' || url_path[url_path.length] === '/') {
                    if (existsSync(this.PUBLIC_DIR + url_path + 'index.gmi')) url_path += 'index.gmi';
                    else if (existsSync(this.PUBLIC_DIR + url_path + 'index.rde')) url_path += 'index.rde';
                }
                else if (url_path.lastIndexOf('.') === -1) {
                    if (existsSync(this.PUBLIC_DIR + url_path + '/index.gmi')) url_path += '/index.gmi';
                    else if (existsSync(this.PUBLIC_DIR + url_path + '/index.rde')) url_path += '/index.rde';
                }
                

                // send response
                const res = responseFromFile(this.PUBLIC_DIR + url_path);
                if (res.header.meta === 'text/gemini+erde') {
                    socket.write(erde(res.body.toString(), query).toUint8Array());
                } else {
                    socket.write(res.toUint8Array());
                }
                

                // add the IP to the client list
                if (this.sessions.indexOf(socket.localAddress) == -1) {
                    this.sessions[socket.localAddress] = new Date().valueOf();
                }

                // end socket
                socket.end();
            });
            socket.on('error', () => socket.write(response(StatusCode.ProxyError).toString()));
        });
    }

    listen(callback: Function) {
        this.SERVER.listen(this.CONFIG['port'], callback);
    }
}

const server = new Tieria().listen(() => console.log("Server bound."));