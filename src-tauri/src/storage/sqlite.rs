use rusqlite::{Connection, Result};
use log::{info, debug, error};

#[derive(Debug)]
#[allow(dead_code)]
struct Person {
    id: i32,
    name: String,
    data: Option<Vec<u8>>,
}

#[allow(dead_code)]
pub fn init_config() -> Result<()> {
    info!("初始化 SQLite 配置");
    let conn = Connection::open_in_memory()?;
    debug!("成功创建内存数据库连接");

    info!("创建 person 表");
    conn.execute(
        "CREATE TABLE person (
            id    INTEGER PRIMARY KEY,
            name  TEXT NOT NULL,
            data  BLOB
        )",
        (), // empty list of parameters.
    )?;
    debug!("person 表创建成功");
    
    let me = Person {
        id: 0,
        name: "Steven".to_string(),
        data: None,
    };
    info!("插入测试数据: name={}", me.name);
    conn.execute(
        "INSERT INTO person (name, data) VALUES (?1, ?2)",
        (&me.name, &me.data),
    )?;
    debug!("测试数据插入成功");

    info!("查询所有 person 数据");
    let mut stmt = conn.prepare("SELECT id, name, data FROM person")?;
    debug!("SQL 语句准备成功");
    
    let person_iter = stmt.query_map([], |row| {
        Ok(Person {
            id: row.get(0)?,
            name: row.get(1)?,
            data: row.get(2)?,
        })
    })?;
    debug!("查询映射创建成功");

    let mut count = 0;
    for person in person_iter {
        match person {
            Ok(p) => {
                debug!("查询到 person: id={}, name={}", p.id, p.name);
                println!("Found person {:?}", p);
                count += 1;
            }
            Err(e) => {
                error!("查询 person 数据失败: {:?}", e);
                println!("Found person error: {:?}", e);
            }
        }
    }
    info!("查询完成，共找到 {} 条记录", count);
    Ok(())
}
