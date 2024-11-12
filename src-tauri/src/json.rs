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
    recur_parse(&mut value);
    to_string_pretty(&value).unwrap()
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

#[tauri::command]
pub fn stringify(str: &str) -> String {
    to_string(&str).unwrap()
}

#[tauri::command]
pub fn parse(str: &str) -> String {
    let result: Result<Value, Error> = from_str(str);
    if result.is_err() {
        return str.to_string();
    }
    let value = result.unwrap();
    if value.is_str() { value.as_str().unwrap().to_string() } else { str.to_string() }
}


fn recur_parse(mut json: &mut Value) {
    match json.get_type() {
        JsonType::Array => {
            let arr = json.as_array_mut().unwrap();
            for item in arr.iter_mut() {
                recur_parse(item);
            }
        }
        JsonType::Object => {
            let obj = json.as_object_mut().unwrap();
            for (_key, value) in obj.iter_mut() {
                recur_parse(value);
            }
        }
        JsonType::String => {
            let s = json.as_str().unwrap();
            let result: Result<Value, Error> = from_str(s);
            if result.is_err() {
                return;
            }
            match result.get_type() {
                JsonType::Object | JsonType::Array | JsonType::String => {
                    let res = result.unwrap();
                    *json = res;
                    recur_parse(&mut json);
                }
                _ => {}
            }
        }
        _ => {}
    }
}
