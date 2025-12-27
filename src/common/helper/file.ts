import fs from "fs";
import path from "path";
import { loggerError } from "./logger";
import sampleDefaultJson from "../data/sample/defaultJson.json";
import sampleDefaultModule from "../data/sample/defaultModule";
import { TConfigType } from "../data/types/config";
import constant from "../data/constant";
const sampleDefaultCommon = require("../data/sample/defaultCommon");

export function readJsonFile(path: string) {
    try{
        const res = fs.readFileSync(path, {
            encoding: "utf8"
        });
        return JSON.parse(res || "{}");
    }catch (e: any){
        loggerError(e?.message);
        return undefined;
    }
}

export async function readTextFile(path: string) {
    try{
        const res = await fs.readFileSync(path, {
            encoding: "utf8"
        });
        return res;
    }catch (e){
        return undefined;
    }
}

export async function isFileExisting(path: string) {
    try {
        const exist = await fs.existsSync(path);
        return exist;
    }catch {
        return false;
    }
}

export async function readSampleFile(type: TConfigType = "json") {
    try{
        if( type == "json" ) return await readJsonFile(path.resolve(__dirname, "..", "data", "sample", "default.json"));
        if( ["commonjs"].includes(type) ) return await readTextFile(path.resolve(__dirname, "..", "data", "sample", "default.js"));
        if( ["module"].includes(type) ) return await readTextFile(path.resolve(__dirname, "..", "data", "sample", "default.js"));
        return undefined;
            
    }catch {
        return undefined;
    }
}

export async function getSampleFile(type: TConfigType = "json") {
    try{
        if( type == "json" ) return sampleDefaultJson;
        if( ["commonjs"].includes(type) ) return sampleDefaultCommon;
        if( ["module"].includes(type) ) return sampleDefaultModule;
        return undefined;
            
    }catch {
        return undefined;
    }
}

export async function writeFile(type: TConfigType = "json", path: string, text: Record<any, any>) {
    try{
        if( type == "json" ) await fs.writeFileSync(path, JSON.stringify(text || "{}", null, constant.FORMAT.SPACE));
        else if( type == "module" ) await fs.writeFileSync(path, `export default ${JSON.stringify(text || "{}", null, constant.FORMAT.SPACE)}`); 
        else if( type == "commonjs" ) await fs.writeFileSync(path, `module.exports = ${JSON.stringify(text || "{}", null, constant.FORMAT.SPACE)}`);
        else throw new Error("Invalid write file type");
    }catch(e: any) {
        throw new Error(e?.message);
    }
}

export async function writeTempFile(path: string, text: any) {
    try{
        return await fs.writeFileSync(path, `${JSON.stringify(text || "{}", null, constant.FORMAT.SPACE)}`);
    }catch(e: any) {
        throw new Error(e?.message);
    }
}

export async function deleteFile(path: string) {
    try{
        console.log( path );
        return await fs.rmSync(path, { force: true });
    }catch(e: any) {
        throw new Error(e?.message);
    }
}