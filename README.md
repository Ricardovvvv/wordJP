# wordJP — 日语单词学习 App

一个纯前端的日语单词记忆应用，支持 iOS/Android/Web，无需服务器。

<p align="center">
  <img src="https://img.shields.io/badge/platform-iOS%20%7C%20Android%20%7C%20Web-blue" />
  <img src="https://img.shields.io/badge/license-MIT-green" />
  <img src="https://img.shields.io/badge/words-19%2C265-orange" />
</p>

## 功能特性

### 7 种练习模式
| 模式 | 说明 |
|------|------|
| 日→中 单词 | 看日语读音，选中文释义 |
| 中→日 单词 | 看中文释义，选日语单词 |
| 汉字→假名 | 看汉字单词，选平假名读音 |
| 假名→汉字 | 看平假名读音，选对应汉字 |
| 日→中 句子 | 看日语单词，选含此词的句子 |
| 中→日 句子 | 看中文释义，选含此词的句子 |
| 刷词模式 | 翻卡片浏览单词，收藏标记 |

### 听力模式
任意答题模式都有一键听力开关——开启后提示词被遮挡，自动播放发音，靠听来选答案。

### 搜索 · 翻译
- **词库搜索**：输入日语/中文即过滤 19,000+ 词汇
- **联网翻译**：MyMemory API 日↔中互译，Jisho 读音，Tatoeba 例句

### 五十音图
完整清音 / 浊音半浊音 / 拗音网格，点击假名听发音。

### 收藏 · 错题本
- ⭐ 收藏单词，刷题时随手标记
- ❌ 错题自动记录，答对自动移除
- 每个词显示答对/答错次数

### 词库管理
- 创建自定义词库，导入 CSV 文件
- 导出词库为 CSV，支持改名、删除
- 教材信息卡片，可添加个人备注

## 内置词库

| 词库 | 词汇数 | 来源 |
|------|--------|------|
| JLPT N5～N1 | 14,611 | 历年真题 + 参考书 |
| 标准日本语 | 3,398 | 初级·中级·高级 |
| 中日词典 | 2,508 | 开源社区整理 |
| みんなの日本語 | 1,128 | 初级 I · II（50 课） |
| Genki | 207 | Genki I（12 课） |
| **总计** | **19,265** | |

## 技术栈

| 层 | 技术 |
|---|------|
| 框架 | Expo (React Native) + TypeScript |
| 路由 | expo-router |
| 数据库 | expo-sqlite（原生）/ 内存数据库（Web） |
| 状态 | Zustand |
| 样式 | React Native StyleSheet |
| 发音 | Youdao dictvoice API（有道词典 TTS） |

## 快速开始

```bash
# 安装依赖
npm install

# 启动 Web 开发服务器
npm start
# 或
npx expo start --web

# 在手机上运行（需要 Expo Go App）
npx expo start
# 手机扫码即可
```

## 数据来源

- [firavoyage/_anki-jlpt-decks](https://github.com/firavoyage/_anki-jlpt-decks) — JLPT N5-N1 词库（中文翻译+例句+语音）
- [smartsl/biaori](https://github.com/smartsl/biaori) — 标准日本语教材词汇
- [lxl66566/Japanese-Chinese-thesaurus](https://github.com/lxl66566/Japanese-Chinese-thesaurus) — 中日词典
- [vitto4/MinnaNoDS](https://github.com/vitto4/MinnaNoDS) — みんなの日本語 初级 I·II 词汇
- [jackiewkr/genki1-vocab](https://github.com/jackiewkr/genki1-vocab) — Genki I 词汇

## 项目结构

```
wordJP/
├── app/                    # expo-router 路由
│   ├── (tabs)/             # 首页 / 搜索 / 五十音 / 我的
│   └── quiz/[mode].tsx     # 答题引擎（6种模式 + 听力模式）
├── src/
│   ├── components/         # WordCard / OptionButton / ProgressBar 等
│   ├── db/                 # 数据库层（SQLite + Web 内存兼容）
│   ├── services/           # 出题 / TTS / 间隔复习
│   ├── stores/             # Zustand 状态管理
│   ├── constants/          # 常量 + 教材信息
│   └── types/              # TypeScript 类型
├── assets/seed/            # 种子数据（vocab.json / sentences.json）
├── scripts/                # 数据下载与处理脚本
└── dist/                   # Web 打包输出
```

## License

MIT

---

Made with ❤️ for Japanese learners worldwide.
