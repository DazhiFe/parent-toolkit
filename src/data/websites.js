// 常用网站分类与数据
export const websiteCategories = [
  { id: 'all', name: '全部', icon: 'grid' },
  { id: 'education', name: '教育政策', icon: 'building' },
  { id: 'learning', name: '在线学习', icon: 'academic' },
  { id: 'reading', name: '阅读资源', icon: 'book-open' },
  { id: 'science', name: '科普知识', icon: 'beaker' },
  { id: 'parenting', name: '亲子育儿', icon: 'heart' },
  { id: 'tools', name: '实用工具', icon: 'wrench' },
  { id: 'news', name: '新闻资讯', icon: 'newspaper' },
  { id: 'health', name: '健康安全', icon: 'shield' }
]

export const websites = [
  // ─── 教育政策 ───
  { id: 'moe', name: '教育部', url: 'http://www.moe.gov.cn/', description: '获取官方教育政策、通知和资源', category: 'education', color: 'blue', icon: 'building', tag: '官方' },
  { id: 'pep', name: '人教网', url: 'http://www.pep.com.cn/', description: '官方教材资源和教学指导', category: 'education', color: 'blue', icon: 'book', tag: '官方' },
  { id: 'neea', name: '中国教育考试网', url: 'https://www.neea.edu.cn/', description: '各类考试报名、成绩查询', category: 'education', color: 'blue', icon: 'clipboard' },
  { id: 'chsi', name: '学信网', url: 'https://www.chsi.com.cn/', description: '学历查询、学籍认证', category: 'education', color: 'blue', icon: 'id-card' },

  // ─── 在线学习 ───
  { id: 'smartedu', name: '国家中小学智慧教育平台', url: 'https://basic.smartedu.cn/', description: '教育部主办，覆盖小学到高中的优质课程资源', category: 'learning', color: 'green', icon: 'academic', tag: '热门' },
  { id: 'icourse', name: '中国大学MOOC', url: 'https://www.icourse163.org/', description: '高等教育优质课程资源共享', category: 'learning', color: 'green', icon: 'play-circle', tag: '免费' },
  { id: 'bilibili-study', name: 'B站知识区', url: 'https://www.bilibili.com/v/knowledge/', description: '海量免费学习视频资源', category: 'learning', color: 'green', icon: 'play-circle', tag: '免费' },

  // ─── 阅读资源 ───
  { id: 'nlc', name: '国家图书馆', url: 'http://www.nlc.cn/', description: '海量数字资源和阅读材料', category: 'reading', color: 'amber', icon: 'book-open', tag: '官方' },
  { id: 'weread', name: '微信读书', url: 'https://weread.qq.com/', description: '优质电子书阅读平台', category: 'reading', color: 'amber', icon: 'book-open' },
  { id: 'douban', name: '豆瓣阅读', url: 'https://read.douban.com/', description: '原创文学与好书推荐', category: 'reading', color: 'amber', icon: 'star' },

  // ─── 科普知识 ───
  { id: 'kepu', name: '科普中国', url: 'http://www.kepu.gov.cn/', description: '权威科学知识和科普资源', category: 'science', color: 'indigo', icon: 'beaker', tag: '官方' },
  { id: 'cdstm', name: '中国数字科技馆', url: 'https://www.cdstm.cn/', description: '在线科技馆，虚拟展厅和科普活动', category: 'science', color: 'indigo', icon: 'globe', tag: '免费' },
  { id: 'guokr', name: '果壳网', url: 'https://www.guokr.com/', description: '有趣的科学知识和科技资讯', category: 'science', color: 'indigo', icon: 'beaker' },

  // ─── 亲子育儿 ───
  { id: 'qinbaobao', name: '亲宝宝', url: 'https://www.qinbaobao.com/', description: '宝宝成长记录与育儿知识', category: 'parenting', color: 'pink', icon: 'heart' },
  { id: 'baobaoshu', name: '宝宝树', url: 'https://www.babytree.com/', description: '孕期育儿知识社区', category: 'parenting', color: 'pink', icon: 'heart' },

  // ─── 实用工具 ───
  { id: 'txdoc', name: '腾讯文档', url: 'https://docs.qq.com/', description: '在线协作文档，多人实时编辑', category: 'tools', color: 'cyan', icon: 'document', tag: '免费' },
  { id: 'shimo', name: '石墨文档', url: 'https://shimo.im/', description: '企业级在线协作文档', category: 'tools', color: 'cyan', icon: 'document' },
  { id: 'cliim', name: '草料二维码', url: 'https://cli.im/', description: '二维码生成、解码和管理', category: 'tools', color: 'cyan', icon: 'qr', tag: '免费' },
  { id: 'baidunaotu', name: '百度脑图', url: 'https://naotu.baidu.com/', description: '在线思维导图工具', category: 'tools', color: 'cyan', icon: 'mindmap', tag: '免费' },
  { id: 'removebg', name: 'Remove.bg', url: 'https://www.remove.bg/', description: 'AI一键去除图片背景', category: 'tools', color: 'cyan', icon: 'image' },

  // ─── 新闻资讯 ───
  { id: 'people', name: '人民日报', url: 'http://www.people.com.cn/', description: '权威时政新闻与评论', category: 'news', color: 'orange', icon: 'newspaper', tag: '官方' },
  { id: 'xinhua', name: '新华网', url: 'http://www.xinhuanet.com/', description: '国家通讯社权威资讯', category: 'news', color: 'orange', icon: 'newspaper', tag: '官方' },
  { id: 'cedu', name: '中国教育报', url: 'https://paper.jyb.cn/', description: '教育领域专业新闻', category: 'news', color: 'orange', icon: 'newspaper' },
  { id: 'thepaper', name: '澎湃新闻', url: 'https://www.thepaper.cn/', description: '专注时政与思想的新闻平台', category: 'news', color: 'orange', icon: 'newspaper' },

  // ─── 健康安全 ───
  { id: 'nhc', name: '国家卫健委', url: 'http://www.nhc.gov.cn/', description: '健康政策和疫情信息发布', category: 'health', color: 'red', icon: 'shield', tag: '官方' },
  { id: 'chinacdc', name: '中国疾控中心', url: 'http://www.chinacdc.cn/', description: '疾病预防和健康指导', category: 'health', color: 'red', icon: 'shield' },
  { id: 'dxy', name: '丁香医生', url: 'https://dxy.com/', description: '专业健康科普和在线问诊', category: 'health', color: 'red', icon: 'heart' },
  { id: 'safetree', name: '安全教育平台', url: 'https://www.xueanquan.com/', description: '学生安全教育和应急知识', category: 'health', color: 'red', icon: 'shield', tag: '热门' }
]
