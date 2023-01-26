import fs from 'fs';
import { response, GeminiResponse, ResponseHeader, ResponseBody } from './response';
import { StatusCode } from './status_codes';

function splice(s, idx, rem, str) {
    return s.slice(0, idx) + str + s.slice(idx + Math.abs(rem));
};

export function erde(page: string, query: string = undefined): GeminiResponse {
    let code = '';
    code += `const query = "${query.trim()}";`;
    while (page.indexOf('<GN') != -1) {

        //console.log(s, '\n')
        code += page.slice(
            page.indexOf('<GN')+3,
            page.indexOf('00>', page.indexOf('<GN'))
        ).trim();
        //console.log('command:', command, '\n')
        //console.log('eval:', eval(command), '\n')
        let evaluated: string;
        try {
            evaluated = eval(code);
        } catch (error) {
            return new GeminiResponse(
                new ResponseHeader(StatusCode.CGIError), new ResponseBody(Buffer.from(error.toString()))
            );
        }
        //s = spliceSlice(s,  s.indexOf('<G '), s.indexOf(' 00>', s.indexOf('<G '))-3+evaluated.length, evaluated);
        //console.log(s.indexOf(' 00>', s.indexOf('<G '))+4)
        if (evaluated !== undefined) {
            page = splice(page, page.indexOf('<GN'), page.indexOf('00>', page.indexOf('<GN')) - page.indexOf('<GN') +3, evaluated)
        } else {
            page = splice(page, page.indexOf('<GN'), page.indexOf('00>', page.indexOf('<GN')) - page.indexOf('<GN') +3, '')
        }
        //s = splice(s, s.indexOf('<G '), s.indexOf(' 00>', s.indexOf('<G ')) - evaluated.length +7, evaluated)
        //console.log('s:', s, '\n')
    }
    //console.log(s, '\n')
    //eval(command)

    return new GeminiResponse(
        new ResponseHeader(StatusCode.Success), new ResponseBody(Buffer.from(page))
    );
}
