use sonic_rs::{from_str, to_string, to_string_pretty, Error, JsonType, JsonValueMutTrait, JsonValueTrait, Value};


#[tauri::command]
pub fn format(str: &str) -> String {
    let result: Result<Value, Error> = from_str(str);
    if result.is_err() {
        return str.to_string();
    }
    let value = result.unwrap();
    let pretty = to_string_pretty(&value);
    pretty.unwrap()
}

#[tauri::command]
pub fn recur_format(str: &str) -> String {
    let result: Result<Value, Error> = from_str(str);
    if result.is_err() {
        return str.to_string();
    }
    let mut value = result.unwrap();
    to_string_pretty(recur_parse(&mut value)).unwrap()
}

#[tauri::command]
pub fn compress(str: &str) -> String {
    let result: Result<Value, Error> = from_str(str);
    if result.is_err() {
        return str.to_string();
    }
    let value = result.unwrap();
    to_string(&value).unwrap()
}

fn recur_parse(json: &mut Value) -> &mut Value {
    match json.get_type() {
        JsonType::Array => {
            let array = json.as_array_mut().unwrap();
            for item in array.iter_mut() {
                recur_parse(item);
            }
            json
        }
        JsonType::Object => {
            let obj = json.as_object_mut().unwrap();
            for (_key, value) in obj.iter_mut() {
                *value = recur_parse(value).clone();
            }
            json
        }
        _ => json,
    }
}
