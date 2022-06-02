import {readFile} from "node:fs/promises"
import {join} from "node:path"

export default async () => {
    const viewPath = join(".","views","index.html")
    return await readFile(viewPath)
}
