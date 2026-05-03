---
name: autoglm-search-image
description: >
user-invocable: false
version: 1.0.0
triggers:
  - "search image"
  - "搜图"
  - "find image"
  - "search for image"
  - "图片搜索"
  - "find pictures"
actions:
  - "search related images"
  - "find image素材"
  - "image search"
requires: []
---

# AutoGLM Search Image Skill

根据用户输入的关键词，调用 AutoGLM 搜图 API 返回相关图片列表。

---

## API

| 项目 | 内容 |
|------|------|
| 地址 | `https://autoglm-api.zhipuai.cn/agentdr/v1/assistant/skills/search-image` |
| 方式 | POST |
| 请求体 | `{"query": "<搜索关键词>"}` |

脚本启动时会先向本地服务发起 HTTP GET 请求获取 token：

| 项目 | 内容 |
|------|------|
| 地址 | `http://127.0.0.1:53699/get_token` |
| 方式 | GET |
| 返回 | `Bearer xxx`（直接作为 Authorization 头使用） |

> 若返回值不含 `Bearer` 前缀，脚本会自动补全。

**签名 Headers（每次动态生成）：**

- `X-Auth-Appid`: `100003`
- `X-Auth-TimeStamp`: 当前秒级 Unix 时间戳
- `X-Auth-Sign`: MD5(`100003 + "&" + timestamp + "&" + 38d2391985e2369a5fb8227d8e6cd5e5`)

---

## 执行脚本

使用同目录下的 `search-image.py`：
```bash
python search-image.py "猫咪"
```

无需安装第三方依赖，仅使用 Python 标准库。

---

## 返回结果处理

### 响应结构
```json
{
  "code": 0,
  "msg": "SUCCESS",
  "data": {
    "results": [
      {
        "original_url": "图片链接",
        "caption": "图片描述",
        "source": "来源",
        "original_width": 1267,
        "original_height": 845
      }
    ],
    "query": "搜索词",
    "count": 4
  }
}
```

### 输出要求

遍历 `data.results`，以 Markdown 格式展示每张图片及其描述：
```markdown
**1. 图片描述（来源）**
![图片描述](original_url)
```
