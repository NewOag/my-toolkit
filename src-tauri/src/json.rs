use sonic_rs::{
    from_str, to_string, to_string_pretty, Error, JsonType, JsonValueMutTrait, JsonValueTrait,
    Value,
};
use log;

#[tauri::command]
pub fn format(str: &str) -> String {
    log::info!("执行 JSON 格式化操作");
    let result: Result<Value, Error> = from_str(str);
    if result.is_err() {
        log::warn!("JSON 格式化失败: 无效的 JSON 格式");
        return str.to_string();
    }
    let value = result.unwrap();
    let pretty = to_string_pretty(&value);
    match &pretty {
        Ok(_) => log::info!("JSON 格式化完成"),
        Err(e) => log::error!("JSON 格式化后序列化失败: {:?}", e),
    }
    pretty.unwrap_or_else(|e| {
        log::error!("JSON 格式化 unwrap_or_else: {:?}", e);
        str.to_string()
    })
}

#[tauri::command]
pub fn recur_format(str: &str) -> String {
    log::info!("执行递归 JSON 格式化");
    let result: Result<Value, Error> = from_str(str);
    if result.is_err() {
        log::warn!("递归 JSON 格式化失败: 无效的 JSON 格式");
        return str.to_string();
    }
    let mut value = result.unwrap();
    recur_parse(&mut value);
    let pretty = to_string_pretty(&value);
    match &pretty {
        Ok(_) => log::info!("递归 JSON 格式化完成"),
        Err(e) => log::error!("递归 JSON 格式化后序列化失败: {:?}", e),
    }
    pretty.unwrap_or_else(|e| {
        log::error!("递归 JSON 格式化 unwrap_or_else: {:?}", e);
        str.to_string()
    })
}

#[tauri::command]
pub fn sort_format(str: &str) -> String {
    log::info!("执行 JSON 排序格式化");
    let result: Result<Value, Error> = from_str(str);
    if result.is_err() {
        log::warn!("JSON 排序格式化失败: 无效的 JSON 格式");
        return str.to_string();
    }
    let mut value = result.unwrap();
    recur_sort(&mut value);
    let pretty = to_string_pretty(&value);
    match &pretty {
        Ok(_) => log::info!("JSON 排序格式化完成"),
        Err(e) => log::error!("JSON 排序格式化后序列化失败: {:?}", e),
    }
    pretty.unwrap_or_else(|e| {
        log::error!("JSON 排序格式化 unwrap_or_else: {:?}", e);
        str.to_string()
    })
}

#[tauri::command]
pub fn compress(str: &str) -> String {
    log::info!("执行 JSON 压缩");
    let result: Result<Value, Error> = from_str(str);
    if result.is_err() {
        log::warn!("JSON 压缩失败: 无效的 JSON 格式");
        return str.to_string();
    }
    let value = result.unwrap();
    let compressed = to_string(&value);
    match &compressed {
        Ok(_) => log::info!("JSON 压缩完成"),
        Err(e) => log::error!("JSON 压缩后序列化失败: {:?}", e),
    }
    compressed.unwrap_or_else(|e| {
        log::error!("JSON 压缩 unwrap_or_else: {:?}", e);
        str.to_string()
    })
}

#[tauri::command]
pub fn stringify(str: &str) -> String {
    log::info!("执行 JSON 字符串化");
    let result = to_string(&str);
    match &result {
        Ok(_) => log::info!("JSON 字符串化完成"),
        Err(e) => log::error!("JSON 字符串化失败: {:?}", e),
    }
    result.unwrap_or_else(|e| {
        log::error!("JSON 字符串化 unwrap_or_else: {:?}", e);
        str.to_string()
    })
}

#[tauri::command]
pub fn parse(str: &str) -> String {
    log::info!("执行 JSON 解析");
    let result: Result<Value, Error> = from_str(str);
    if result.is_err() {
        log::warn!("JSON 解析失败: 无效的 JSON 格式");
        return str.to_string();
    }
    let value = result.unwrap();
    if value.is_str() {
        let s = value.as_str().unwrap_or("");
        log::info!("JSON 解析为字符串: {}", s);
        s.to_string()
    } else {
        log::info!("JSON 解析为非字符串，返回原内容");
        str.to_string()
    }
}

fn recur_sort(json: &mut Value) {
    match json.get_type() {
        JsonType::Array => {
            log::debug!("递归排序数组");
            let arr = json.as_array_mut().unwrap();
            for v in arr.iter_mut() {
                recur_sort(v);
            }
            arr.sort_by_key(|obj| {
                let s = to_string(obj).unwrap_or_else(|e| {
                    log::error!("数组元素 to_string 失败: {:?}", e);
                    String::new()
                });
                s
            })
        }
        JsonType::Object => {
            log::debug!("递归排序对象");
            let obj = json.as_object_mut().unwrap();
            let mut entries = vec![];
            for (k, v) in obj.iter_mut() {
                recur_sort(v);
                entries.push((k, v.take()));
            }
            entries.sort_by_key(|(k, v)| {
                let type_order = match v.get_type() {
                    JsonType::String => 0,
                    JsonType::Null => 1,
                    JsonType::Number => 2,
                    JsonType::Boolean => 3,
                    JsonType::Object => 4,
                    JsonType::Array => 5,
                };
                (type_order, k.to_string())
            });
            let mut object = sonic_rs::Object::new();
            for (k, v) in entries {
                object.insert(&k, v);
            }
            *json = object.into();
        }
        _ => {
            log::debug!("递归排序遇到非对象/数组类型");
        }
    }
}

fn recur_parse(mut json: &mut Value) {
    match json.get_type() {
        JsonType::Array => {
            log::debug!("递归解析数组");
            let arr = json.as_array_mut().unwrap();
            for item in arr.iter_mut() {
                recur_parse(item);
            }
        }
        JsonType::Object => {
            log::debug!("递归解析对象");
            let obj = json.as_object_mut().unwrap();
            for (_key, value) in obj.iter_mut() {
                recur_parse(value);
            }
        }
        JsonType::String => {
            log::debug!("递归解析字符串");
            let s = json.as_str().unwrap_or("");
            let result: Result<Value, Error> = from_str(s);
            if result.is_err() {
                log::warn!("递归解析字符串失败: 无效的 JSON 字符串");
                return;
            }
            match result.get_type() {
                JsonType::Object | JsonType::Array | JsonType::String => {
                    let res = result.unwrap();
                    *json = res;
                    recur_parse(&mut json);
                }
                _ => {
                    log::debug!("递归解析字符串遇到非对象/数组/字符串类型");
                }
            }
        }
        _ => {
            log::debug!("递归解析遇到非对象/数组/字符串类型");
        }
    }
}
