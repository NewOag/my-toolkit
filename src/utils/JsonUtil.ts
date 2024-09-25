/**
 * parse string to object and parse its property to object if it's valid json string
 * @param json json
 */
export function recurParseObj(json: any): any {
    if (!json) {
        return json
    }
    if (typeof json == "string") {
        try {
            const parsed = JSON.parse(json)
            // number/boolean/null
            if (parsed && typeof parsed != "object") {
                return json
            }
            json = parsed
        } catch (e) {
            // string
            return json
        }
        // object/array
        return recurParseObj(json)
    }
    if (typeof json == "object") {
        for (const key in json) {
            json[key] = recurParseObj(json[key])
        }
        return json
    }
    if (Array.isArray(json)) {
        for (let i = 0; json && i < json.length; i++) {
            json[i] = recurParseObj(json[i])
        }
        return json
    }
    return json
}
