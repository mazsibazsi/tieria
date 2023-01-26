import { StatusCode } from "./status_codes";
import { readFileSync  } from 'fs';
import { mime } from "./mimetypes";
import path from 'path';

export function responseFromFile(file_path: string): GeminiResponse {
    try {
        const extension = file_path.slice(file_path.lastIndexOf('.'));
        console.log(file_path, extension, mime[extension]);
        const header = new ResponseHeader(StatusCode.Success, mime[extension]);
        const body = new ResponseBody(
                readFileSync(path.resolve(file_path))
        );
        //console.log(body.data);
        return new GeminiResponse(header, body);
        
    } catch {
        return responseNotFound();
    }
}

export function response(code: StatusCode, meta: string = ''): GeminiResponse {
    return new GeminiResponse(new ResponseHeader(code, meta), new ResponseBody());
}

export function responseInput(prompt: string, sensitive: boolean = false): string {
    let header = new ResponseHeader(StatusCode.Input, prompt);
    if (sensitive) header = new ResponseHeader(StatusCode.SensitiveInput, prompt);
    return new GeminiResponse(header).toString();
}

function responseNotFound(): GeminiResponse {
    const header = new ResponseHeader(StatusCode.NotFound, 'Not found.');
    const body = new ResponseBody();
    return new GeminiResponse(header, body);
}

export function responseSlowDown(): string {
    const header = new ResponseHeader(StatusCode.SlowDown, 'Too many requests. Slow down.');
    const body = new ResponseBody();
    return new GeminiResponse(header, body).toString();
}

export class GeminiResponse {
    header: ResponseHeader;
    body: ResponseBody;

    constructor(header: ResponseHeader, body: ResponseBody = new ResponseBody()) {
        this.header = header;
        this.body = body;
    }

    toString() {
        return this.header.toString() + this.body.toString();
    }

    toUint8Array(): Uint8Array {
        let response = new Uint8Array(this.header.toUint8Array().length + this.body.toUint8Array().length);
        response.set(this.header.toUint8Array());
        response.set(this.body.toUint8Array(), this.header.toUint8Array().length);
        return response;
    }

}

export class ResponseHeader {
    status_code: StatusCode;
    meta: string;

    constructor(status_code: StatusCode, meta: string = '') {
        this.status_code = status_code;
        this.meta = meta;
    }
    
    toString(): string {
        return this.status_code.toString() + ' ' + this.meta + '\r\n';
    }

    toUint8Array(): Uint8Array {
        let header = new Uint8Array(new ArrayBuffer(this.toString().length));
        header.forEach((_, i) => header[i] = this.toString().charCodeAt(i))
        return header;
    }
}

export class ResponseBody {
    data: Uint8Array;
    
    constructor(data: Uint8Array = new Uint8Array()) {
        this.data = data;
    }

    toString(): string {
        return this.data.toString();
    }

    toUint8Array(): Uint8Array {
        return this.data;
    }
}