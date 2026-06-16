// AI 工具分类与数据
export const aiToolCategories = [
  { id: 'all',      name: '全部',       icon: 'grid' },
  { id: 'chat',     name: 'AI对话助手', icon: 'chat' },
  { id: 'news',     name: 'AI资讯',     icon: 'news' },
  { id: 'image',    name: 'AI图形生成', icon: 'image' },
  { id: 'video',    name: 'AI视频生成', icon: 'video' },
  { id: 'learning', name: 'AI学习资源', icon: 'learning' },
  { id: 'audio',    name: 'AI音频处理', icon: 'audio' },
]

export const aiTools = [
  // ─── AI对话助手 ───
  { id: 'doubao', name: '豆包', url: 'https://www.doubao.com',
    description: '字节跳动出品，支持多领域知识问答',
    category: 'chat', color: 'blue', letter: '豆', tag: '热门', audience: 'kid' },
  { id: 'qianwen', name: '千问', url: 'https://qianwen.aliyun.com',
    description: '阿里云出品，强大的语言理解与生成能力',
    category: 'chat', color: 'purple', letter: '千' },
  { id: 'zhipu', name: '智谱清言', url: 'https://chatglm.cn',
    description: '智谱AI出品，提供高质量对话体验',
    category: 'chat', color: 'indigo', letter: '智' },
  { id: 'wenxin', name: '文心一言', url: 'https://yiyan.baidu.com',
    description: '百度出品，强大的知识理解与生成能力',
    category: 'chat', color: 'red', letter: '文' },
  { id: 'deepseek', name: 'DeepSeek', url: 'https://chat.deepseek.com/',
    description: '探索未至之境，强大的AI推理能力',
    category: 'chat', color: 'cyan', letter: 'D', tag: '热门' },

  // ─── AI资讯 ───
  { id: 'aihot', name: 'AIHOT', url: 'https://aihot.virxact.com/',
    description: 'AI热点资讯聚合平台，汇集全球AI行业最新动态',
    category: 'news', color: 'red', letter: 'A' },
  { id: 'codefather', name: '鱼皮AI导航', url: 'https://ai.codefather.cn/',
    description: '程序员鱼皮整理的AI工具导航和学习资源',
    category: 'news', color: 'blue', letter: '鱼' },

  // ─── AI图形生成 ───
  { id: 'jimeng-img', name: '即梦AI · 图片',
    url: 'https://jimeng.jianying.com/ai-tool/generate?enter_from=ai_feature&from_page=explore&ai_feature_name=image',
    description: '一站式AI创作平台，支持图片生成、视频生成、数字人等功能',
    category: 'image', color: 'orange', letter: '即' },

  // ─── AI视频生成 ───
  { id: 'jimeng-vid', name: '即梦AI · 视频',
    url: 'https://jimeng.jianying.com/ai-tool/generate?enter_from=ai_feature&from_page=explore&ai_feature_name=omniReference',
    description: '一站式AI创作平台，支持图片生成、视频生成、数字人等功能',
    category: 'video', color: 'orange', letter: '即' },

  // ─── AI学习资源 ───
  { id: 'feishu-community', name: '飞行社', url: 'https://www.feishu.cn/community',
    description: '飞书社区，AI学习资源和实践案例分享平台',
    category: 'learning', color: 'blue', letter: '飞' },
  { id: 'feixianglaoshi', name: '飞象老师', url: 'https://www.feixianglaoshi.com/',
    description: 'AI教学动画和互动课件制作平台',
    category: 'learning', color: 'orange', letter: '象' },

  // ─── AI音频处理 ───
  { id: 'tongyi-audio', name: '千问音视频速读', url: 'https://www.tongyi.com/discover/audioread',
    description: 'AI快速提取音视频重点内容，支持多种格式',
    category: 'audio', color: 'purple', letter: '千' },
]
