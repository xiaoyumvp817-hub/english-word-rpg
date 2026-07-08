/**
 * Generate primary school word data files (外研版 3-6年级).
 * Word lists sourced from renrendoc.com — 外研版小学三至六年级最新单词表汇总.
 *
 * Usage: node tools/gen_primary_words.js
 */

const fs = require('fs');
const path = require('path');

// ========== Word Data ==========

const TEXTBOOKS = [
  // ==================== 三年级上册 ====================
  {
    id: 'wy-3a',
    name: '外研版三年级上册',
    shortName: '外研 3A',
    modules: [
      {
        name: 'Module 1',
        theme: '问候与介绍',
        bossName: '问候小妖',
        bossEnglishName: 'Greeting Imp',
        description: '学习基本问候语和自我介绍的词汇',
        words: [
          { e: 'I', c: '我' },
          { e: 'am', c: '是' },
          { e: 'hello', c: '你好' },
          { e: 'goodbye', c: '再见' },
          { e: 'are', c: '是' },
          { e: 'How are you?', c: '你好吗？' },
          { e: 'good', c: '好' },
          { e: 'morning', c: '早晨，上午' },
          { e: 'fine', c: '健康的' },
          { e: 'thank', c: '谢谢' },
          { e: 'you', c: '你' }
        ]
      },
      {
        name: 'Module 2',
        theme: '姓名与称呼',
        bossName: '名字吞噬者',
        bossEnglishName: 'Name Devourer',
        description: '学习询问姓名和称呼的词汇',
        words: [
          { e: 'Ms', c: '女士' },
          { e: 'boy', c: '男孩' },
          { e: 'girl', c: '女孩' },
          { e: 'and', c: '那么，和' },
          { e: 'too', c: '也' },
          { e: 'what', c: '什么' },
          { e: 'Mr', c: '先生' },
          { e: 'is', c: '是' },
          { e: 'your', c: '你的' },
          { e: 'name', c: '名字' },
          { e: 'please', c: '请' },
          { e: 'afternoon', c: '下午' }
        ]
      },
      {
        name: 'Module 3',
        theme: '教室与指令',
        bossName: '教室幽灵',
        bossEnglishName: 'Classroom Ghost',
        description: '学习教室物品和课堂指令的词汇',
        words: [
          { e: 'point', c: '指' },
          { e: 'to', c: '向' },
          { e: 'the', c: '这（那）个，这（那）些' },
          { e: 'door', c: '门' },
          { e: 'sit', c: '坐' },
          { e: 'down', c: '向下' },
          { e: 'stand', c: '站' },
          { e: 'up', c: '向上' },
          { e: 'window', c: '窗户' },
          { e: 'blackboard', c: '黑板' },
          { e: 'bird', c: '鸟' },
          { e: 'desk', c: '书桌' },
          { e: 'chair', c: '椅子' }
        ]
      },
      {
        name: 'Module 4',
        theme: '颜色与动物',
        bossName: '变色龙之王',
        bossEnglishName: 'Chameleon King',
        description: '学习颜色和常见动物的词汇',
        words: [
          { e: 'it', c: '它' },
          { e: 'red', c: '红色的' },
          { e: 'look', c: '看' },
          { e: 'yellow', c: '黄色的' },
          { e: 'blue', c: '蓝色的' },
          { e: 'a', c: '一个' },
          { e: 'chameleon', c: '变色龙' },
          { e: 'my', c: '我的' },
          { e: 'panda', c: '熊猫' },
          { e: 'now', c: '现在' },
          { e: 'green', c: '绿色的' },
          { e: 'black', c: '黑色的' },
          { e: 'dog', c: '狗' },
          { e: 'cat', c: '猫' },
          { e: 'cap', c: '帽子' }
        ]
      },
      {
        name: 'Module 5',
        theme: '数字',
        bossName: '数字魔像',
        bossEnglishName: 'Number Golem',
        description: '学习数字1-12的英文表达',
        words: [
          { e: 'how many', c: '多少' },
          { e: 'one', c: '一' },
          { e: 'two', c: '二' },
          { e: 'three', c: '三' },
          { e: 'four', c: '四' },
          { e: 'five', c: '五' },
          { e: 'six', c: '六' },
          { e: 'seven', c: '七' },
          { e: 'eight', c: '八' },
          { e: 'nine', c: '九' },
          { e: 'ten', c: '十' },
          { e: 'eleven', c: '十一' },
          { e: 'twelve', c: '十二' }
        ]
      },
      {
        name: 'Module 6',
        theme: '生日与礼物',
        bossName: '生日窃贼',
        bossEnglishName: 'Birthday Thief',
        description: '学习生日祝福和礼物相关的词汇',
        words: [
          { e: 'happy', c: '快乐的' },
          { e: 'birthday', c: '生日' },
          { e: 'here', c: '这里' },
          { e: 'present', c: '礼物' },
          { e: 'this', c: '这个' },
          { e: 'pencil', c: '铅笔' },
          { e: 'pen', c: '钢笔' },
          { e: 'cake', c: '蛋糕' },
          { e: 'old', c: '…岁的' },
          { e: 'how old', c: '多大' },
          { e: 'yes', c: '是的' }
        ]
      },
      {
        name: 'Module 7',
        theme: '学校生活',
        bossName: '校园守卫',
        bossEnglishName: 'School Guardian',
        description: '学习学校场所和物品的词汇',
        words: [
          { e: 'teacher', c: '教师' },
          { e: 'pupil', c: '小学生' },
          { e: 'school', c: '学校' },
          { e: 'classroom', c: '教室' },
          { e: 'English', c: '英语' },
          { e: 'that', c: '那个' },
          { e: 'say', c: '说' },
          { e: 'again', c: '再一次' },
          { e: 'schoolbag', c: '书包' },
          { e: 'ball', c: '球' },
          { e: 'book', c: '书' }
        ]
      },
      {
        name: 'Module 8',
        theme: '位置与物品',
        bossName: '迷路小怪',
        bossEnglishName: 'Lost Sprite',
        description: '学习询问位置和常见物品的词汇',
        words: [
          { e: 'monster', c: '怪物' },
          { e: 'new', c: '新的' },
          { e: 'kite', c: '风筝' },
          { e: 'or', c: '或者' },
          { e: 'know', c: '知道' },
          { e: 'no', c: '不' },
          { e: 'help', c: '救命（呼救用语）' },
          { e: 'where', c: '哪里' },
          { e: 'in', c: '在…里' },
          { e: 'bag', c: '包' }
        ]
      },
      {
        name: 'Module 9',
        theme: '家庭成员与职业',
        bossName: '家族幻影',
        bossEnglishName: 'Family Phantom',
        description: '学习家庭成员和常见职业的词汇',
        words: [
          { e: 'mother', c: '母亲' },
          { e: 'father', c: '父亲' },
          { e: 'sister', c: '姐妹' },
          { e: 'brother', c: '兄弟' },
          { e: 'she', c: '她' },
          { e: 'grandpa', c: '祖父；外祖父' },
          { e: 'grandma', c: '祖母；外祖母' },
          { e: 'me', c: '我' },
          { e: 'he', c: '他' },
          { e: 'doctor', c: '医生' },
          { e: 'policeman', c: '警察' },
          { e: 'nurse', c: '护士' },
          { e: 'driver', c: '司机' },
          { e: 'farmer', c: '农民' }
        ]
      },
      {
        name: 'Module 10',
        theme: '身体部位',
        bossName: '拼图怪人',
        bossEnglishName: 'Puzzle Fiend',
        description: '学习身体部位的词汇',
        words: [
          { e: 'his', c: '他的' },
          { e: 'head', c: '头' },
          { e: 'leg', c: '腿' },
          { e: 'foot', c: '脚' },
          { e: 'on', c: '在…上' },
          { e: 'arm', c: '胳膊' },
          { e: 'hand', c: '手' },
          { e: 'her', c: '她的' },
          { e: 'nose', c: '鼻子' },
          { e: 'eye', c: '眼睛' },
          { e: 'mouth', c: '嘴' },
          { e: 'ear', c: '耳朵' }
        ]
      }
    ]
  },

  // ==================== 三年级下册 ====================
  {
    id: 'wy-3b',
    name: '外研版三年级下册',
    shortName: '外研 3B',
    modules: [
      {
        name: 'Module 1',
        theme: '喜好与颜色',
        bossName: '色彩吞噬者',
        bossEnglishName: 'Color Eater',
        description: '学习表达喜好和颜色的词汇',
        words: [
          { e: 'song', c: '歌曲' },
          { e: 'TV', c: '电视台' },
          { e: 'favourite', c: '最喜欢的' },
          { e: 'colour', c: '颜色' },
          { e: 'Here you are.', c: '给你。' }
        ]
      },
      {
        name: 'Module 2',
        theme: '动物与特征',
        bossName: '动物园守卫',
        bossEnglishName: 'Zoo Keeper',
        description: '学习动物和描述特征的词汇',
        words: [
          { e: 'they', c: '它（他，她）们' },
          { e: 'monkey', c: '猴子' },
          { e: 'baby', c: '幼兽，幼畜' },
          { e: 'zoo', c: '动物园' },
          { e: 'tiger', c: '老虎' },
          { e: 'lion', c: '狮子' },
          { e: 'elephant', c: '大象' },
          { e: 'fat', c: '胖的' },
          { e: 'man', c: '人，男人' },
          { e: 'short', c: '矮的' },
          { e: 'tall', c: '高的' },
          { e: 'small', c: '小的' },
          { e: 'thin', c: '瘦的' },
          { e: 'big', c: '大的' }
        ]
      },
      {
        name: 'Module 3',
        theme: '运动与活动',
        bossName: '懒惰之影',
        bossEnglishName: 'Shadow of Laziness',
        description: '学习运动和活动的词汇',
        words: [
          { e: 'like', c: '喜欢' },
          { e: 'football', c: '足球' },
          { e: 'them', c: '它（他，她）们' },
          { e: 'basketball', c: '篮球' },
          { e: 'table tennis', c: '乒乓球' },
          { e: 'morning exercises', c: '早操' },
          { e: 'ride', c: '骑' },
          { e: 'bike', c: '自行车' },
          { e: 'swim', c: '游泳' },
          { e: 'skip', c: '跳绳' }
        ]
      },
      {
        name: 'Module 4',
        theme: '食物',
        bossName: '贪吃巨鼠',
        bossEnglishName: 'Glutton Rat',
        description: '学习常见食物和饮食的词汇',
        words: [
          { e: 'meat', c: '肉' },
          { e: 'pass', c: '传递' },
          { e: 'rice', c: '米饭' },
          { e: 'mum', c: '妈妈' },
          { e: 'noodles', c: '面条（常复数）' },
          { e: 'fish', c: '鱼肉，鱼' },
          { e: 'but', c: '但是' },
          { e: 'milk', c: '牛奶' },
          { e: 'does', c: 'do的第三人称单数形式' },
          { e: 'orange', c: '橘子' },
          { e: 'apple', c: '苹果' },
          { e: 'banana', c: '香蕉' },
          { e: 'pear', c: '梨' }
        ]
      },
      {
        name: 'Module 5',
        theme: '日常活动',
        bossName: '时间窃贼',
        bossEnglishName: 'Time Thief',
        description: '学习日常活动和星期的词汇',
        words: [
          { e: 'goes', c: '去，到' },
          { e: 'go to school', c: '上学' },
          { e: 'on', c: '在…的时候；通过，以…的方式' },
          { e: 'Monday', c: '星期一' },
          { e: 'play', c: '打（球）' },
          { e: 'phone', c: '电话' },
          { e: 'friend', c: '朋友' },
          { e: 'at', c: '在' },
          { e: 'home', c: '家' },
          { e: 'who', c: '谁' },
          { e: 'only', c: '仅，只有' },
          { e: 'year', c: '年龄，岁数' },
          { e: 'work', c: '工作' },
          { e: 'Saturday', c: '星期六' },
          { e: 'shopping', c: '购物' },
          { e: 'dad', c: '爸爸' }
        ]
      },
      {
        name: 'Module 6',
        theme: '周末活动',
        bossName: '懒惰周末怪',
        bossEnglishName: 'Lazy Weekend Beast',
        description: '学习周末活动和学科的词汇',
        words: [
          { e: 'do', c: '做' },
          { e: 'Sunday', c: '星期日' },
          { e: 'swimming', c: '游泳（运动）' },
          { e: 'eat', c: '吃' },
          { e: 'sleep', c: '睡觉' },
          { e: 'watch', c: '观看' },
          { e: 'have', c: '做，进行' },
          { e: 'class', c: '课，班级' },
          { e: 'today', c: '今天' },
          { e: 'music', c: '音乐' },
          { e: 'has', c: '做，进行' },
          { e: 'Chinese', c: '语文，汉语' },
          { e: 'maths', c: '数学' },
          { e: 'art', c: '美术' },
          { e: 'science', c: '科学' },
          { e: 'PE', c: '体育' }
        ]
      },
      {
        name: 'Module 7',
        theme: '季节与天气',
        bossName: '四季精灵',
        bossEnglishName: 'Season Sprite',
        description: '学习季节、天气和自然现象的词汇',
        words: [
          { e: 'we', c: '我们' },
          { e: 'fly', c: '放（风筝）' },
          { e: 'spring', c: '春天' },
          { e: 'summer', c: '夏天' },
          { e: 'season', c: '季节' },
          { e: 'nice', c: '迷人的，令人愉快的' },
          { e: 'warm', c: '暖和的' },
          { e: 'hot', c: '热的' },
          { e: 'autumn', c: '秋天' },
          { e: 'cool', c: '凉爽的' },
          { e: 'winter', c: '冬天' },
          { e: 'cold', c: '寒冷的' },
          { e: 'skating', c: '滑冰' },
          { e: 'snow', c: '雪，下雪' },
          { e: 'rain', c: '雨，下雨' },
          { e: 'sunny', c: '晴朗的' },
          { e: 'windy', c: '有风的' },
          { e: 'very', c: '非常，很' }
        ]
      },
      {
        name: 'Module 8',
        theme: '位置与户外',
        bossName: '藏匿之影',
        bossEnglishName: 'Hiding Shadow',
        description: '学习方位、户外活动的词汇',
        words: [
          { e: 'toy', c: '玩具' },
          { e: 'under', c: '在…下面' },
          { e: 'for', c: '为，给，对' },
          { e: 'box', c: '盒子' },
          { e: 'behind', c: '在…后面' },
          { e: 'bedroom', c: '卧室' },
          { e: 'flies', c: 'fly的三单形式' },
          { e: 'park', c: '公园' },
          { e: 'lake', c: '湖' },
          { e: 'tree', c: '树' },
          { e: 'fishing', c: '钓鱼' },
          { e: 'walk', c: '行走，步行' }
        ]
      },
      {
        name: 'Module 9',
        theme: '衣物与交通',
        bossName: '衣柜怪物',
        bossEnglishName: 'Wardrobe Monster',
        description: '学习衣物和交通工具的词汇',
        words: [
          { e: 'have got', c: '有' },
          { e: 'sweater', c: '毛线衫' },
          { e: 'bed', c: '床' },
          { e: 'line', c: '线，绳' },
          { e: 'about', c: '关于' },
          { e: 'animal', c: '动物' },
          { e: 'sport', c: '运动' },
          { e: 'dress', c: '连衣裙，女装' },
          { e: 'coat', c: '外套' },
          { e: 'T-shirt', c: 'T恤衫' },
          { e: 'has got', c: '有（三单）' },
          { e: 'by', c: '乘坐（交通工具）' },
          { e: 'bus', c: '公共汽车' },
          { e: 'car', c: '轿车，汽车' }
        ]
      },
      {
        name: 'Module 10',
        theme: '衣物与聚会',
        bossName: '换装小妖',
        bossEnglishName: 'Dress-up Imp',
        description: '学习衣物和聚会相关的词汇',
        words: [
          { e: 'hat', c: '帽子' },
          { e: 'come', c: '来，来到' },
          { e: 'clothes', c: '衣服' },
          { e: 'open', c: '打开' },
          { e: 'put on', c: '穿上' },
          { e: 'funny', c: '滑稽的' },
          { e: 'party', c: '聚会' },
          { e: 'OK', c: '好的' },
          { e: 'brown', c: '棕色的' },
          { e: 'trousers', c: '裤子' },
          { e: 'shirt', c: '衬衫' },
          { e: 'shoe', c: '鞋子' },
          { e: 'turn', c: '轮到的机会' },
          { e: 'white', c: '白色' },
          { e: 'photo', c: '照片' },
          { e: 'skirt', c: '裙子' }
        ]
      }
    ]
  },

  // ==================== 四年级上册 ====================
  {
    id: 'wy-4a',
    name: '外研版四年级上册',
    shortName: '外研 4A',
    modules: [
      {
        name: 'Module 1',
        theme: '问路与方向',
        bossName: '迷路巨魔',
        bossEnglishName: 'Lost Troll',
        description: '学习问路和方向的词汇',
        words: [
          { e: 'straight', c: '直地，直线地' },
          { e: 'left', c: '左边；向左；左边的' },
          { e: 'right', c: '右边；向右；右边的' },
          { e: 'lost', c: '迷路的' },
          { e: 'live', c: '居住' },
          { e: 'street', c: '大街，街道' },
          { e: 'excuse me', c: '对不起；打扰一下' },
          { e: 'turn left', c: '向左转' },
          { e: 'turn right', c: '向右转' },
          { e: 'next to', c: '紧靠旁边，贴近' },
          { e: 'supermarket', c: '超市' },
          { e: 'beside', c: '在旁边，在附近' },
          { e: 'cinema', c: '电影院' },
          { e: 'station', c: '车站' },
          { e: 'train', c: '火车' },
          { e: 'hill', c: '小山' },
          { e: 'near', c: '接近，临近' },
          { e: 'house', c: '房屋' }
        ]
      },
      {
        name: 'Module 2',
        theme: '活动与交流',
        bossName: '沉默之影',
        bossEnglishName: 'Shadow of Silence',
        description: '学习日常活动和交流的词汇',
        words: [
          { e: 'read', c: '读，阅读' },
          { e: 'running', c: '跑步' },
          { e: 'these', c: '这些' },
          { e: 'picture', c: '照片' },
          { e: 'take', c: '拍摄' },
          { e: 'take pictures', c: '照相' },
          { e: 'children', c: '孩子们' },
          { e: 'listen', c: '听' },
          { e: 'talk', c: '说话，交谈' },
          { e: 'China', c: '中国' }
        ]
      },
      {
        name: 'Module 3',
        theme: '休闲活动',
        bossName: '无聊巨兽',
        bossEnglishName: 'Boredom Beast',
        description: '学习休闲活动和娱乐的词汇',
        words: [
          { e: 'kid', c: '小孩' },
          { e: 'get on', c: '上车' },
          { e: 'can', c: '能够' },
          { e: 'see', c: '看到' },
          { e: 'lots of', c: '许多' },
          { e: 'interesting', c: '有趣的' },
          { e: 'thing', c: '东西；物品' },
          { e: 'people', c: '人；人们' },
          { e: 'row', c: '划（船）' },
          { e: 'dragon', c: '龙' },
          { e: 'boat', c: '船' },
          { e: 'dragon boat', c: '龙舟' },
          { e: 'men', c: '男人' },
          { e: 'between', c: '在…之间，在…中间' },
          { e: 'chess', c: '国际象棋' },
          { e: 'drink', c: '喝' },
          { e: 'soya milk', c: '豆浆' },
          { e: 'clock', c: '钟' },
          { e: 'hungry', c: '饥饿的' },
          { e: 'draw', c: '画' },
          { e: 'jump', c: '跳' },
          { e: 'sing', c: '唱歌' },
          { e: 'dance', c: '跳舞' }
        ]
      },
      {
        name: 'Module 4',
        theme: '食物与购物',
        bossName: '饥饿巨魔',
        bossEnglishName: 'Hungry Troll',
        description: '学习食物和购物的词汇',
        words: [
          { e: 'want', c: '想要' },
          { e: 'some', c: '一些' },
          { e: 'juice', c: '果汁' },
          { e: 'ice', c: '冰，冰块' },
          { e: 'also', c: '也' },
          { e: 'food', c: '食物' },
          { e: 'fast food', c: '快餐' },
          { e: 'make', c: '制作' },
          { e: 'tomato', c: '番茄，西红柿' },
          { e: 'egg', c: '鸡蛋' },
          { e: 'potato', c: '马铃薯，土豆' },
          { e: 'How much?', c: '多少钱？' },
          { e: 'flower', c: '花' },
          { e: 'dumpling', c: '水饺' },
          { e: 'help', c: '帮助，帮忙' },
          { e: 'buy', c: '买' }
        ]
      },
      {
        name: 'Module 5',
        theme: '运动与比赛',
        bossName: '竞速恶魔',
        bossEnglishName: 'Racing Demon',
        description: '学习运动和比赛的词汇',
        words: [
          { e: 'run', c: '跑，奔跑' },
          { e: 'fast', c: '快，快速地' },
          { e: 'sky', c: '天空' },
          { e: 'high', c: '高高地' },
          { e: 'winner', c: '获胜者' },
          { e: 'far', c: '远' },
          { e: 'afraid', c: '恐怕' },
          { e: 'strong', c: '健壮的' },
          { e: 'star', c: '明星' }
        ]
      },
      {
        name: 'Module 6',
        theme: '节日与庆祝',
        bossName: '万圣节幽灵',
        bossEnglishName: 'Halloween Ghost',
        description: '学习节日和庆祝活动的词汇',
        words: [
          { e: 'sweets', c: '糖果' },
          { e: 'soup', c: '汤' },
          { e: 'sorry', c: '抱歉，对不起' },
          { e: 'bread', c: '面包' },
          { e: 'dark', c: '黑暗的' },
          { e: 'turn on', c: '打开' },
          { e: 'light', c: '灯' },
          { e: 'Halloween', c: '万圣节前夕' },
          { e: 'trick or treat', c: '不请吃就捣蛋' },
          { e: 'give', c: '给' },
          { e: 'come in', c: '进来' },
          { e: 'of course', c: '当然' }
        ]
      },
      {
        name: 'Module 7',
        theme: '农场与自然',
        bossName: '农场守卫',
        bossEnglishName: 'Farm Guardian',
        description: '学习农场动物和自然的词汇',
        words: [
          { e: 'there is', c: '有，存在' },
          { e: 'horse', c: '马' },
          { e: 'there are', c: '有，存在' },
          { e: 'have a look', c: '看一看' },
          { e: 'sheep', c: '绵羊' },
          { e: 'vegetable', c: '蔬菜' },
          { e: 'climb', c: '爬，攀登' },
          { e: 'face', c: '脸，面孔' },
          { e: 'fruit', c: '水果' },
          { e: 'chicken', c: '鸡' },
          { e: 'bear', c: '熊' },
          { e: 'pig', c: '猪' }
        ]
      },
      {
        name: 'Module 8',
        theme: '旅行计划',
        bossName: '旅行幽灵',
        bossEnglishName: 'Travel Wraith',
        description: '学习旅行和计划的词汇',
        words: [
          { e: 'visit', c: '参观；拜访' },
          { e: 'tomorrow', c: '明天' },
          { e: 'plane', c: '飞机' },
          { e: 'get up', c: '起床' },
          { e: 'o\'clock', c: '…点钟' },
          { e: 'from', c: '从…来，来自' },
          { e: 'sea', c: '大海' },
          { e: 'swimsuit', c: '游泳衣' },
          { e: 'sock', c: '短袜' },
          { e: 'fish', c: '钓鱼' }
        ]
      },
      {
        name: 'Module 9',
        theme: '运动会',
        bossName: '运动场冠军',
        bossEnglishName: 'Sports Field Champion',
        description: '学习运动会和比赛的词汇',
        words: [
          { e: 'sports day', c: '运动日' },
          { e: 'win', c: '胜利，取胜' },
          { e: 'month', c: '月' },
          { e: 'hundred', c: '一百' },
          { e: 'meter', c: '米（长度单位）' },
          { e: 'every', c: '每个，每一' },
          { e: 'luck', c: '运气' },
          { e: 'good luck', c: '祝你好运' },
          { e: 'come on', c: '加油' },
          { e: 'high jump', c: '跳高' },
          { e: 'long jump', c: '跳远' },
          { e: 'subject', c: '科目' }
        ]
      },
      {
        name: 'Module 10',
        theme: '节日与传统',
        bossName: '春节年兽',
        bossEnglishName: 'Nian Beast',
        description: '学习中国传统节日的词汇',
        words: [
          { e: 'Chinese', c: '中国的' },
          { e: 'festival', c: '节日' },
          { e: 'peanut', c: '花生' },
          { e: 'merry', c: '愉快的' },
          { e: 'naughty', c: '淘气的' },
          { e: 'a bit', c: '有点儿' },
          { e: 'family', c: '家庭' },
          { e: 'dinner', c: '晚餐' },
          { e: 'year', c: '年' },
          { e: 'New Year', c: '新年' },
          { e: 'the Spring Festival', c: '春节' },
          { e: 'Christmas', c: '圣诞节' },
          { e: 'Merry Christmas!', c: '圣诞快乐！' }
        ]
      }
    ]
  },

  // ==================== 四年级下册 ====================
  {
    id: 'wy-4b',
    name: '外研版四年级下册',
    shortName: '外研 4B',
    modules: [
      {
        name: 'Module 1',
        theme: '人物描述',
        bossName: '害羞精灵',
        bossEnglishName: 'Shy Sprite',
        description: '学习描述人物性格和外貌的词汇',
        words: [
          { e: 'nice', c: '友好的，亲切的，讨人喜欢的' },
          { e: 'clever', c: '聪明的' },
          { e: 'a bit', c: '有点儿' },
          { e: 'shy', c: '害羞的' },
          { e: 'answer', c: '接（电话）' },
          { e: 'call', c: '电话；（给）打电话' },
          { e: 'bad', c: '不好的，坏的' },
          { e: 'cool', c: '酷的' },
          { e: 'aunt', c: '姨母；姑母；舅母；伯母；婶母' },
          { e: 'uncle', c: '伯父；叔父；舅父；姑父；姨父' },
          { e: 'big', c: '年龄较大的' },
          { e: 'little', c: '幼小的，年幼的' },
          { e: 'cute', c: '可爱的' }
        ]
      },
      {
        name: 'Module 2',
        theme: '城市与地标',
        bossName: '城市巨像',
        bossEnglishName: 'City Colossus',
        description: '学习城市和著名地标的词汇',
        words: [
          { e: 'city', c: '城市' },
          { e: 'ship', c: '船' },
          { e: 'beautiful', c: '美丽的' },
          { e: 'whose', c: '谁的' },
          { e: 'queen', c: '女王' },
          { e: 'close', c: '近的，接近的' },
          { e: 'old', c: '年代久的，古老的' },
          { e: 'famous', c: '著名的' }
        ]
      },
      {
        name: 'Module 3',
        theme: '未来与计划',
        bossName: '未来机器人',
        bossEnglishName: 'Future Robot',
        description: '学习未来计划和星期的词汇',
        words: [
          { e: 'robot', c: '机器人' },
          { e: 'will', c: '将，将会' },
          { e: 'everything', c: '所有事情' },
          { e: 'one day', c: '（将来）有一天' },
          { e: 'housework', c: '家务活' },
          { e: 'learn', c: '学习' },
          { e: 'our', c: '我们的' },
          { e: 'homework', c: '家庭作业' },
          { e: 'Tuesday', c: '星期二' },
          { e: 'Wednesday', c: '星期三' },
          { e: 'Thursday', c: '星期四' },
          { e: 'Friday', c: '星期五' },
          { e: 'have', c: '有，拥有' },
          { e: 'next', c: '下一个的' },
          { e: 'week', c: '星期，周' },
          { e: 'holiday', c: '假期' }
        ]
      },
      {
        name: 'Module 4',
        theme: '户外活动',
        bossName: '阴云怪',
        bossEnglishName: 'Cloud Beast',
        description: '学习户外活动和天气的词汇',
        words: [
          { e: 'take', c: '带，拿' },
          { e: 'fly', c: '飞' },
          { e: 'picnic', c: '野餐' },
          { e: 'great', c: '太好了，好极了' },
          { e: 'why', c: '为什么' },
          { e: 'because', c: '因为' },
          { e: 'so', c: '所以' },
          { e: 'cloudy', c: '多云的' },
          { e: 'weather', c: '天气' }
        ]
      },
      {
        name: 'Module 5',
        theme: '过去与变化',
        bossName: '时光倒影',
        bossEnglishName: 'Time Reflection',
        description: '学习过去时态和描述变化的词汇',
        words: [
          { e: 'was', c: '是（过去式）' },
          { e: 'then', c: '当时，那时' },
          { e: 'grandparent', c: '祖父；祖母；外祖父；外祖母' },
          { e: 'were', c: '是（过去式）' },
          { e: 'young', c: '年轻的' },
          { e: 'old', c: '老的，年老的' },
          { e: 'hair', c: '头发' },
          { e: 'so', c: '这么，那么' },
          { e: 'short', c: '短的' },
          { e: 'long', c: '长的' },
          { e: 'clean', c: '干净的' },
          { e: 'dirty', c: '脏的' }
        ]
      },
      {
        name: 'Module 6',
        theme: '过去经历',
        bossName: '昨日幽灵',
        bossEnglishName: 'Yesterday Wraith',
        description: '学习描述过去经历的词汇',
        words: [
          { e: 'yesterday', c: '昨天' },
          { e: 'out', c: '不在家（的）；在外面（的）' },
          { e: 'well', c: '健康的' },
          { e: 'thanks', c: '谢谢' },
          { e: 'sun', c: '太阳' },
          { e: 'lesson', c: '一节课，一堂课' },
          { e: 'village', c: '乡村，村子' }
        ]
      },
      {
        name: 'Module 7',
        theme: '家务与通讯',
        bossName: '家务巨魔',
        bossEnglishName: 'Chore Troll',
        description: '学习家务活动和通讯的词汇',
        words: [
          { e: 'had', c: '度过' },
          { e: 'phone', c: '（给）打电话' },
          { e: 'cook', c: '烹调；煮；烧' },
          { e: 'really', c: '真的' },
          { e: 'wash', c: '洗' },
          { e: 'computer', c: '计算机；电脑' },
          { e: 'loved', c: '爱；喜欢' },
          { e: 'him', c: '（宾格）他' },
          { e: 'Mrs', c: '太太，夫人' },
          { e: 'Miss', c: '小姐' }
        ]
      },
      {
        name: 'Module 8',
        theme: '周末趣事',
        bossName: '趣事精灵',
        bossEnglishName: 'Fun Sprite',
        description: '学习描述过去趣事的词汇',
        words: [
          { e: 'sang', c: '唱歌（过去式）' },
          { e: 'beautifully', c: '优美地，动听地' },
          { e: 'saw', c: '看见（过去式）' },
          { e: 'game', c: '游戏；比赛' },
          { e: 'last', c: '最近过去的' },
          { e: 'fun', c: '有趣的事' },
          { e: 'went', c: '去（过去式）' },
          { e: 'there', c: '在那儿，往那里' },
          { e: 'ate', c: '吃（过去式）' },
          { e: 'drank', c: '喝，饮（过去式）' },
          { e: 'drink', c: '饮料' },
          { e: 'time', c: '一段时间' },
          { e: 'have a good time', c: '玩得开心' },
          { e: 'busy', c: '忙的，忙碌的' },
          { e: 'took', c: '拍摄（过去式）' },
          { e: 'told', c: '告诉，告知（过去式）' },
          { e: 'great', c: '非常好的，令人愉快的' },
          { e: 'delicious', c: '美味的，可口的' },
          { e: 'made', c: '做，制作（过去式）' },
          { e: 'poster', c: '海报，张贴画' }
        ]
      },
      {
        name: 'Module 9',
        theme: '旅行与问候',
        bossName: '明信片怪客',
        bossEnglishName: 'Postcard Stranger',
        description: '学习旅行和书信的词汇',
        words: [
          { e: 'welcome', c: '欢迎' },
          { e: 'postcard', c: '明信片' },
          { e: 'cousin', c: '表（堂）兄弟；表（堂）姐妹' },
          { e: 'dear', c: '亲爱的' },
          { e: 'on holiday', c: '在休假，在度假' },
          { e: 'travel', c: '旅行；游历' },
          { e: 'came', c: '来（过去式）' },
          { e: 'pop', c: '流行音乐的' },
          { e: 'concert', c: '音乐会' },
          { e: 'earth', c: '地球' }
        ]
      },
      {
        name: 'Module 10',
        theme: '意外与健康',
        bossName: '病痛恶魔',
        bossEnglishName: 'Ailment Demon',
        description: '学习意外伤害和健康问题的词汇',
        words: [
          { e: 'fell', c: '掉下，落下；摔倒（过去式）' },
          { e: 'fall off', c: '跌落' },
          { e: 'fall down', c: '摔倒，跌倒；坍塌' },
          { e: 'found', c: '发现，找到（过去式）' },
          { e: 'town', c: '城镇，市镇' },
          { e: 'happen', c: '发生' },
          { e: 'rode', c: '骑车（过去式）' },
          { e: 'then', c: '然后' },
          { e: 'thirsty', c: '口渴的' },
          { e: 'water', c: '水' },
          { e: 'bought', c: '买（过去式）' },
          { e: 'watermelon', c: '西瓜' },
          { e: 'carried', c: '拿，搬（过去式）' },
          { e: 'bump', c: '撞伤' },
          { e: 'hospital', c: '医院' },
          { e: 'chocolate', c: '巧克力' },
          { e: 'stomach ache', c: '胃痛' },
          { e: 'cold', c: '感冒' },
          { e: 'headache', c: '头痛' },
          { e: 'fever', c: '发烧' }
        ]
      }
    ]
  },

  // ==================== 五年级上册 ====================
  {
    id: 'wy-5a',
    name: '外研版五年级上册',
    shortName: '外研 5A',
    modules: [
      {
        name: 'Module 1',
        theme: '日常生活',
        bossName: '日常巨魔',
        bossEnglishName: 'Daily Troll',
        description: '学习描述日常活动的词汇',
        words: [
          { e: 'met', c: '碰上，遇见（过去式）' },
          { e: 'above', c: '在上方，在之上' },
          { e: 'ground', c: '地面' },
          { e: 'those', c: '那些' },
          { e: 'ice cream', c: '冰激淋' },
          { e: 'us', c: '我们' },
          { e: 'finish', c: '吃完，喝完，用尽' },
          { e: 'wait', c: '等待，等候' },
          { e: 'hurry', c: '赶紧，赶快' },
          { e: 'dropped', c: '使掉落（过去式）' },
          { e: 'send', c: '发送，寄' },
          { e: 'email', c: '电子邮件' },
          { e: 'ran', c: '跑（过去式）' },
          { e: 'love', c: '爱你的' }
        ]
      },
      {
        name: 'Module 2',
        theme: '购物',
        bossName: '购物狂魔',
        bossEnglishName: 'Shopping Fiend',
        description: '学习购物和数量的词汇',
        words: [
          { e: 'list', c: '清单' },
          { e: 'need', c: '需要' },
          { e: 'first', c: '首先，第一' },
          { e: 'can', c: '可以' },
          { e: 'lost', c: '丢失' },
          { e: 'how much', c: '多少' },
          { e: 'cheese', c: '奶酪' },
          { e: 'any', c: '一些，一点，若干' },
          { e: 'use', c: '使用' },
          { e: 'over there', c: '在那边' },
          { e: 'bottle', c: '瓶子，一瓶的容量' },
          { e: 'half', c: '一半' },
          { e: 'kilo', c: '千克' },
          { e: 'a lot of', c: '许多的' }
        ]
      },
      {
        name: 'Module 3',
        theme: '旅行与名胜',
        bossName: '迷路行者',
        bossEnglishName: 'Lost Wanderer',
        description: '学习旅行和名胜古迹的词汇',
        words: [
          { e: 'weekend', c: '周末' },
          { e: 'place', c: '地方' },
          { e: 'British', c: '英国的，英国人的，英国人' },
          { e: 'museum', c: '博物馆' },
          { e: 'how', c: '如何，怎样' },
          { e: 'best', c: '最' },
          { e: 'took', c: '搭乘，乘坐（过去式）' },
          { e: 'trip', c: '旅行，旅程' },
          { e: 'along', c: '沿着' },
          { e: 'river', c: '河，江' },
          { e: 'hour', c: '小时' },
          { e: 'twenty', c: '二十' },
          { e: 'minute', c: '分钟' },
          { e: 'of', c: '关于…的' },
          { e: 'wall', c: '墙，城墙' },
          { e: 'arrive', c: '到达' },
          { e: 'for', c: '达，计' },
          { e: 'mountain', c: '山' },
          { e: 'with', c: '拥有，具有' },
          { e: 'plant', c: '植物' }
        ]
      },
      {
        name: 'Module 4',
        theme: '衣物纠纷',
        bossName: '争吵双胞胎',
        bossEnglishName: 'Bickering Twins',
        description: '学习衣物和解决纠纷的词汇',
        words: [
          { e: 'pair', c: '一套，一双，一副' },
          { e: 'shorts', c: '短裤' },
          { e: 'argue', c: '争吵' },
          { e: 'matter', c: '问题，麻烦' },
          { e: 'took', c: '拿走，取走' },
          { e: 'wear', c: '穿' },
          { e: 'sports', c: '体育运动' }
        ]
      },
      {
        name: 'Module 5',
        theme: '数字与课堂',
        bossName: '数字巫师',
        bossEnglishName: 'Number Wizard',
        description: '学习数字和课堂活动的词汇',
        words: [
          { e: 'crayon', c: '蜡笔' },
          { e: 'begin', c: '开始' },
          { e: 'give out', c: '分发' },
          { e: 'all right', c: '好，行' },
          { e: 'floor', c: '地面，地板' },
          { e: 'happily', c: '幸福地，愉快地' },
          { e: 'many', c: '许多，很多' },
          { e: 'number', c: '数字' },
          { e: 'eleven', c: '十一' },
          { e: 'twelve', c: '十二' },
          { e: 'thirteen', c: '十三' },
          { e: 'fourteen', c: '十四' },
          { e: 'fifteen', c: '十五' },
          { e: 'sixteen', c: '十六' },
          { e: 'seventeen', c: '十七' },
          { e: 'eighteen', c: '十八' },
          { e: 'nineteen', c: '十九' },
          { e: 'twenty', c: '二十' },
          { e: 'thirty', c: '三十' },
          { e: 'forty', c: '四十' },
          { e: 'fifty', c: '五十' },
          { e: 'sixty', c: '六十' },
          { e: 'seventy', c: '七十' },
          { e: 'eighty', c: '八十' },
          { e: 'ninety', c: '九十' },
          { e: 'hundred', c: '一百' }
        ]
      },
      {
        name: 'Module 6',
        theme: '运动与团队',
        bossName: '球队队长',
        bossEnglishName: 'Team Captain',
        description: '学习团队运动的词汇',
        words: [
          { e: 'well', c: '好，熟练地' },
          { e: 'team', c: '运动队，球队' },
          { e: 'really', c: '很，非常' },
          { e: 'good at', c: '擅长' },
          { e: 'catch', c: '抓住，接住' },
          { e: 'goalkeeper', c: '守门员' },
          { e: 'think', c: '想，认为' },
          { e: 'fantastic', c: '极好的' },
          { e: 'fan', c: '狂热仰慕者，迷' },
          { e: 'past', c: '过去' },
          { e: 'swam', c: '游泳（过去式）' },
          { e: 'slow', c: '慢的' },
          { e: 'healthy', c: '健康的' }
        ]
      },
      {
        name: 'Module 7',
        theme: '助人为乐',
        bossName: '冷漠之影',
        bossEnglishName: 'Shadow of Apathy',
        description: '学习帮助他人和社区服务的词汇',
        words: [
          { e: 'a lot', c: '许多，大量' },
          { e: 'useful', c: '有用的' },
          { e: 'show', c: '节目' },
          { e: 'presenter', c: '主持人' },
          { e: 'blind', c: '失明的，瞎的' },
          { e: 'deaf', c: '失聪的，聋的' },
          { e: 'hear', c: '听到' },
          { e: 'her', c: '她' },
          { e: 'fire', c: '火灾，失火' },
          { e: 'firefighter', c: '消防员' },
          { e: 'hot dog', c: '热狗' },
          { e: 'sausage', c: '香肠' },
          { e: 'kind', c: '友好的，善意的，体贴的' }
        ]
      },
      {
        name: 'Module 8',
        theme: '学校作息',
        bossName: '迟到精灵',
        bossEnglishName: 'Tardy Sprite',
        description: '学习学校作息和日常习惯的词汇',
        words: [
          { e: 'time', c: '时间' },
          { e: 'school', c: '学校' },
          { e: 'start', c: '开始，发生' },
          { e: 'past', c: '晚于，过' },
          { e: 'late', c: '迟到的' },
          { e: 'go to bed', c: '上床睡觉' },
          { e: 'exercise', c: '运动，锻炼' },
          { e: 'playground', c: '操场' },
          { e: 'before', c: '在…之前' },
          { e: 'join', c: '加入，参加' },
          { e: 'skipping rope', c: '跳绳' },
          { e: 'coffee', c: '咖啡' },
          { e: 'tea', c: '茶' },
          { e: 'always', c: '总是，一直' },
          { e: 'bell', c: '钟，铃' },
          { e: 'rang', c: '鸣，响（过去式）' },
          { e: 'into', c: '进入…里面' }
        ]
      },
      {
        name: 'Module 9',
        theme: '情绪与感受',
        bossName: '悲伤之雾',
        bossEnglishName: 'Mist of Sorrow',
        description: '学习情绪表达和感受的词汇',
        words: [
          { e: 'feel', c: '感觉' },
          { e: 'bored', c: '厌烦的，厌倦的' },
          { e: 'sad', c: '伤心的，难过的' },
          { e: 'miss', c: '想念' },
          { e: 'angry', c: '生气的，愤怒的' },
          { e: 'ill', c: '有病的，不健康的' },
          { e: 'told', c: '告诉' },
          { e: 'better', c: '痊愈的，恢复健康的' },
          { e: 'farm', c: '农场' },
          { e: 'tired', c: '累的，疲劳的' },
          { e: 'won', c: '赢，获胜' },
          { e: 'ruler', c: '直尺' },
          { e: 'smell', c: '闻出，嗅出' }
        ]
      },
      {
        name: 'Module 10',
        theme: '家居与安全',
        bossName: '家居幽灵',
        bossEnglishName: 'House Wraith',
        description: '学习家居房间和安全意识的词汇',
        words: [
          { e: 'kitchen', c: '厨房' },
          { e: 'toilet', c: '厕所，卫生间' },
          { e: 'room', c: '房间' },
          { e: 'living room', c: '起居室，客厅' },
          { e: 'hide-and-seek', c: '捉迷藏' },
          { e: 'now', c: '好' },
          { e: 'last', c: '最后' },
          { e: 'hide', c: '躲' },
          { e: 'sofa', c: '沙发' },
          { e: 'shout', c: '呼喊，大叫' },
          { e: 'grass', c: '草' },
          { e: 'baby', c: '婴儿' },
          { e: 'dangerous', c: '危险的' }
        ]
      }
    ]
  },

  // ==================== 五年级下册 ====================
  {
    id: 'wy-5b',
    name: '外研版五年级下册',
    shortName: '外研 5B',
    modules: [
      {
        name: 'Module 1',
        theme: '时代变迁',
        bossName: '时代幻影',
        bossEnglishName: 'Era Phantom',
        description: '学习描述过去和变化的词汇',
        words: [
          { e: 'different', c: '不同的' },
          { e: 'lady', c: '女士' },
          { e: 'interviewer', c: '采访者' },
          { e: 'television', c: '电视机' },
          { e: 'grandchildren', c: '孙子，孙女' },
          { e: 'change', c: '改变，变化' },
          { e: 'night', c: '夜晚，夜间' },
          { e: 'work', c: '工作' },
          { e: 'field', c: '田地' },
          { e: 'fire', c: '火' },
          { e: 'or', c: '也不' },
          { e: 'radio', c: '收音机' },
          { e: 'telephone', c: '电话' },
          { e: 'write', c: '写' },
          { e: 'hope', c: '希望' },
          { e: 'still', c: '仍然' },
          { e: 'programme', c: '节目' }
        ]
      },
      {
        name: 'Module 2',
        theme: '学习与教学',
        bossName: '知识守护者',
        bossEnglishName: 'Knowledge Keeper',
        description: '学习教学和语言学习的词汇',
        words: [
          { e: 'learnt', c: '学习（过去式）' },
          { e: 'taught', c: '教，讲授（过去式）' },
          { e: 'language', c: '语言' },
          { e: 'wrote', c: '写（过去式）' },
          { e: 'dancer', c: '舞蹈演员' },
          { e: 'foreign', c: '外国的' },
          { e: 'studied', c: '学习（过去式）' }
        ]
      },
      {
        name: 'Module 3',
        theme: '饮食文化',
        bossName: '汉堡怪人',
        bossEnglishName: 'Burger Fiend',
        description: '学习传统饮食文化的词汇',
        words: [
          { e: 'hamburger', c: '汉堡包' },
          { e: 'breakfast', c: '早餐' },
          { e: 'lunch', c: '午餐' },
          { e: 'sandwich', c: '三明治' },
          { e: 'fish and chips', c: '炸鱼加炸薯条' },
          { e: 'traditional', c: '传统的' },
          { e: 'dish', c: '食品，菜肴' },
          { e: 'very much', c: '很，非常' },
          { e: 'gave', c: '给（过去式）' },
          { e: 'tonight', c: '今晚' }
        ]
      },
      {
        name: 'Module 4',
        theme: '图书馆与研究',
        bossName: '书虫长老',
        bossEnglishName: 'Bookworm Elder',
        description: '学习图书馆和研究相关的词汇',
        words: [
          { e: 'library', c: '图书馆' },
          { e: 'sent', c: '发送，寄（过去式）' },
          { e: 'CD', c: '激光唱片，光盘' },
          { e: 'idea', c: '主意，想法' },
          { e: 'put', c: '放，安放' },
          { e: 'shelf', c: '架子' },
          { e: 'heavy', c: '重的，沉的' },
          { e: 'dictionary', c: '字典' },
          { e: 'card', c: '卡片' },
          { e: 'library card', c: '图书卡，借书证' },
          { e: 'ask', c: '问' },
          { e: 'wrong', c: '错误的' },
          { e: 'dear', c: '哎呀' },
          { e: 'information', c: '信息' },
          { e: 'e-book', c: '电子书' },
          { e: 'project', c: '项目' },
          { e: 'guide', c: '介绍，指南，手册' },
          { e: 'film', c: '电影' },
          { e: 'as well', c: '又，还，也' },
          { e: 'way', c: '方法，方式' },
          { e: 'on', c: '关于' },
          { e: 'topic', c: '话题' }
        ]
      },
      {
        name: 'Module 5',
        theme: '购物与物品',
        bossName: '百货店幽灵',
        bossEnglishName: 'Department Store Ghost',
        description: '学习购物和物品描述的词汇',
        words: [
          { e: 'light', c: '轻的' },
          { e: 'broken', c: '坏的' },
          { e: 'hard', c: '困难的，费力的' },
          { e: 'department store', c: '百货商店' },
          { e: 'pocket', c: '口袋，兜' },
          { e: 'umbrella', c: '雨伞' },
          { e: 'sales assistant', c: '售货员，营业员' },
          { e: 'wheel', c: '轮子' },
          { e: 'easy', c: '容易的，不费力的' },
          { e: 'take', c: '选择要' },
          { e: 'too', c: '太，过于' },
          { e: 'try', c: '尝试' },
          { e: 'lovely', c: '美丽的，可爱的，令人愉快的' }
        ]
      },
      {
        name: 'Module 6',
        theme: '旅行与方向',
        bossName: '罗盘精灵',
        bossEnglishName: 'Compass Sprite',
        description: '学习旅行和方向描述的词汇',
        words: [
          { e: 'moon', c: '月亮，月球' },
          { e: 'get', c: '到达' },
          { e: 'west', c: '西部' },
          { e: 'parent', c: '父亲或母亲' },
          { e: 'stay', c: '停留' },
          { e: 'July', c: '七月' },
          { e: 'south', c: '南部' },
          { e: 'remember', c: '记得' },
          { e: 'June', c: '六月' },
          { e: 'east', c: '东部' },
          { e: 'best', c: '最好的' },
          { e: 'north', c: '北部' },
          { e: 'rest', c: '休息' },
          { e: 'have a rest', c: '休息下' },
          { e: 'rode', c: '骑（过去式）' }
        ]
      },
      {
        name: 'Module 7',
        theme: '工作与时间',
        bossName: '时间守卫',
        bossEnglishName: 'Time Warden',
        description: '学习工作和时间表达的词汇',
        words: [
          { e: 'evening', c: '傍晚，晚上' },
          { e: 'late', c: '近日暮的，近深夜的，时间不早的' },
          { e: 'worker', c: '工人' },
          { e: 'factory', c: '制造厂，工厂' },
          { e: 'early', c: '早的' },
          { e: 'taxi', c: '出租车，计程车' },
          { e: 'quarter', c: '一刻钟' },
          { e: 'to', c: '（距整点）去…' },
          { e: 'worry', c: '焦虑，担心' }
        ]
      },
      {
        name: 'Module 8',
        theme: '手工制作',
        bossName: '剪纸精灵',
        bossEnglishName: 'Papercut Sprite',
        description: '学习手工制作和材料的词汇',
        words: [
          { e: 'paper', c: '纸' },
          { e: 'Chinese', c: '中国人' },
          { e: 'so', c: '如此，这样' },
          { e: 'word', c: '词，字' },
          { e: 'drew', c: '画（过去式）' },
          { e: 'cut', c: '剪，切，割' },
          { e: 'piece', c: '张，片，块' },
          { e: 'paint', c: '绘画，着色' },
          { e: 'put', c: '放，安放' },
          { e: 'stick', c: '小木棍，小木条' },
          { e: 'tied', c: '扎上，系上（过去式）' },
          { e: 'string', c: '线，绳子' }
        ]
      },
      {
        name: 'Module 9',
        theme: '娱乐与故事',
        bossName: '笑话大师',
        bossEnglishName: 'Joke Master',
        description: '学习娱乐、故事和笑话的词汇',
        words: [
          { e: 'laugh', c: '笑' },
          { e: 'wore', c: '穿（过去式）' },
          { e: 'letter', c: '信，书信' },
          { e: 'theater', c: '剧院' },
          { e: 'women', c: '女性，妇女' },
          { e: 'actor', c: '演员' },
          { e: 'told', c: '口述，讲（过去式）' },
          { e: 'joke', c: '笑话' },
          { e: 'after', c: '在…之后' },
          { e: 'show', c: '演出，上演' },
          { e: 'restaurant', c: '饭店，餐馆' },
          { e: 'ready', c: '准备好的' },
          { e: 'borrow', c: '借入，借来' },
          { e: 'read', c: '读' },
          { e: 'another', c: '另一个' },
          { e: 'history', c: '历史' },
          { e: 'ask', c: '问，询问' },
          { e: 'question', c: '问题' },
          { e: 'forget', c: '忘记' },
          { e: 'bring', c: '带来，拿来' },
          { e: 'soon', c: '不久，很快' }
        ]
      },
      {
        name: 'Module 10',
        theme: '旅行准备',
        bossName: '护照守卫',
        bossEnglishName: 'Passport Guardian',
        description: '学习旅行准备和机场的词汇',
        words: [
          { e: 'when', c: '在什么时候' },
          { e: 'end', c: '结束，终止' },
          { e: 'nervous', c: '紧张的，情绪不安的' },
          { e: 'all right', c: '没事，没问题' },
          { e: 'airport', c: '机场' },
          { e: 'ticket', c: '票' },
          { e: 'passport', c: '护照' },
          { e: 'safe', c: '安全的，平安的' },
          { e: 'pet', c: '宠物' },
          { e: 'speak', c: '说，讲' }
        ]
      }
    ]
  },

  // ==================== 六年级上册 ====================
  {
    id: 'wy-6a',
    name: '外研版六年级上册',
    shortName: '外研 6A',
    modules: [
      {
        name: 'Module 1',
        theme: '国家与地理',
        bossName: '地理巨像',
        bossEnglishName: 'Geography Colossus',
        description: '学习国家和地理知识的词汇',
        words: [
          { e: 'building', c: '建筑物' },
          { e: 'American', c: '美国的，美国人' },
          { e: 'find out', c: '发现，弄清' },
          { e: 'more', c: '更多的，较多的' },
          { e: 'more than', c: '超过' },
          { e: 'thousand', c: '一千' },
          { e: 'kilometre', c: '千米，公里' },
          { e: 'something', c: '某事物，某种东西' },
          { e: 'million', c: '百万' },
          { e: 'map', c: '地图' },
          { e: 'right', c: '正确的' },
          { e: 'country', c: '国家' }
        ]
      },
      {
        name: 'Module 2',
        theme: '文化与社区',
        bossName: '唐人街守卫',
        bossEnglishName: 'Chinatown Guardian',
        description: '学习社区文化的词汇',
        words: [
          { e: 'dancing', c: '跳舞，舞蹈' },
          { e: 'Chinatown', c: '唐人街，中国城' },
          { e: 'sometimes', c: '有时' },
          { e: 'shop', c: '商店' },
          { e: 'then', c: '既然是这样，那么' },
          { e: 'strong', c: '坚固的' }
        ]
      },
      {
        name: 'Module 3',
        theme: '爱好与收集',
        bossName: '收藏狂人',
        bossEnglishName: 'Collection Maniac',
        description: '学习爱好和收藏的词汇',
        words: [
          { e: 'collect', c: '收集' },
          { e: 'stamp', c: '邮票' },
          { e: 'hobby', c: '业余爱好' },
          { e: 'doll', c: '玩具娃娃' },
          { e: 'bicycle', c: '自行车' }
        ]
      },
      {
        name: 'Module 4',
        theme: '节日与文化',
        bossName: '节日精灵',
        bossEnglishName: 'Festival Sprite',
        description: '学习中西方节日的词汇',
        words: [
          { e: 'Thanksgiving', c: '感恩节' },
          { e: 'flag', c: '旗；国旗' },
          { e: 'Flag Day', c: '（美国）国旗制定纪念日' },
          { e: 'fly', c: '（使）（旗帜）飘扬' },
          { e: 'special', c: '特殊的，特别的' },
          { e: 'meal', c: '餐' },
          { e: 'sound', c: '听起来' },
          { e: 'football', c: '（美式）橄榄球' },
          { e: 'moon cake', c: '月饼' },
          { e: 'the Mid-Autumn Festival', c: '中秋节' },
          { e: 'the Dragon Boat Festival', c: '端午节' },
          { e: 'race', c: '比赛，竞赛' },
          { e: 'lantern', c: '灯笼' },
          { e: 'the Lantern Festival', c: '元宵节' },
          { e: 'hang', c: '悬挂，吊' }
        ]
      },
      {
        name: 'Module 5',
        theme: '笔友与交流',
        bossName: '书信幽灵',
        bossEnglishName: 'Letter Wraith',
        description: '学习通信和交流的词汇',
        words: [
          { e: 'pen friend', c: '笔友' },
          { e: 'Pleased to meet you!', c: '很高兴见到你！' },
          { e: 'address', c: '地址' },
          { e: 'French', c: '法语' },
          { e: 'age', c: '年龄' },
          { e: 'story', c: '故事' },
          { e: 'candy', c: '糖果' }
        ]
      },
      {
        name: 'Module 6',
        theme: '世界文化',
        bossName: '文化使者',
        bossEnglishName: 'Culture Envoy',
        description: '学习世界文化的词汇',
        words: [
          { e: 'world', c: '世界' },
          { e: 'often', c: '经常' },
          { e: 'difficult', c: '困难的' },
          { e: 'knife', c: '餐刀，刀子' },
          { e: 'chopsticks', c: '筷子' },
          { e: 'Japanese', c: '日本的' },
          { e: 'believe', c: '相信' },
          { e: 'snake', c: '蛇' },
          { e: 'DVD', c: '数字化视频光盘，DVD光盘' },
          { e: 'together', c: '一起，共同' },
          { e: 'lucky', c: '幸运的' },
          { e: 'bamboo', c: '竹子' },
          { e: 'its', c: '它的' },
          { e: 'body', c: '身体' },
          { e: 'flute', c: '笛子' },
          { e: 'get', c: '变得，变成' },
          { e: 'frightened', c: '恐惧的，害怕的' }
        ]
      },
      {
        name: 'Module 7',
        theme: '规则与礼仪',
        bossName: '规则守卫',
        bossEnglishName: 'Rule Guardian',
        description: '学习公共规则和礼仪的词汇',
        words: [
          { e: 'long ago', c: '很久以前' },
          { e: 'stop', c: '（使）停止' },
          { e: 'clean', c: '打扫；（使）清洁' },
          { e: 'camera', c: '照相机' },
          { e: 'show', c: '把…给（某人）看' },
          { e: 'never', c: '从不' },
          { e: 'around', c: '在四周，到处' },
          { e: 'inside', c: '向室内，向里面' },
          { e: 'should', c: '应该' },
          { e: 'line', c: '（等候的）长队，队列' },
          { e: 'stand in line', c: '排队' },
          { e: 'close', c: '关门，关闭' },
          { e: 'librarian', c: '图书管理员' },
          { e: 'rule', c: '规定，规章' },
          { e: 'quiet', c: '安静的' },
          { e: 'problem', c: '麻烦，困难，问题' },
          { e: 'cross', c: '穿过（马路等）；渡过（河）' }
        ]
      },
      {
        name: 'Module 8',
        theme: '购物与消费',
        bossName: '收银机怪',
        bossEnglishName: 'Cash Register Beast',
        description: '学习购物和消费的词汇',
        words: [
          { e: 'look', c: '看上去' },
          { e: 'cashier', c: '收银员' },
          { e: 'cola', c: '可乐' },
          { e: 'dollar', c: '美元' },
          { e: 'cent', c: '美分' },
          { e: 'enjoy', c: '享用，享受' }
        ]
      }
    ]
  },

  // ==================== 六年级下册 ====================
  {
    id: 'wy-6b',
    name: '外研版六年级下册',
    shortName: '外研 6B',
    modules: [
      {
        name: 'Module 1',
        theme: '餐饮与点餐',
        bossName: '餐厅幽灵',
        bossEnglishName: 'Restaurant Wraith',
        description: '学习餐厅点餐和饮食的词汇',
        words: [
          { e: 'hot dog', c: '热狗' },
          { e: 'cashier', c: '收银员' },
          { e: 'cola', c: '可乐' },
          { e: 'dollar', c: '美元' },
          { e: 'cent', c: '美分' },
          { e: 'enjoy', c: '享用，享受' },
          { e: 'meal', c: '餐' },
          { e: 'restaurant', c: '饭店，餐馆' }
        ]
      },
      {
        name: 'Module 2',
        theme: '天气与自然',
        bossName: '暴风之灵',
        bossEnglishName: 'Storm Spirit',
        description: '学习天气现象和自然的词汇',
        words: [
          { e: 'later', c: '后来，以后' },
          { e: 'dark', c: '黑暗的' },
          { e: 'cloud', c: '云' },
          { e: 'dry', c: '干的' },
          { e: 'stay', c: '停留' },
          { e: 'sky', c: '天空' },
          { e: 'rain', c: '雨，下雨' },
          { e: 'snow', c: '雪，下雪' }
        ]
      },
      {
        name: 'Module 3',
        theme: '日常活动',
        bossName: '懒虫巨兽',
        bossEnglishName: 'Sloth Beast',
        description: '学习日常活动和时间安排的词汇',
        words: [
          { e: 'shine', c: '照耀' },
          { e: 'everyone', c: '每个人' },
          { e: 'fly away', c: '飞走' },
          { e: 'cry', c: '哭' },
          { e: 'just', c: '就，刚才' },
          { e: 'cow', c: '奶牛' },
          { e: 'blow', c: '吹' },
          { e: 'rabbit', c: '兔子' }
        ]
      },
      {
        name: 'Module 4',
        theme: '计划与未来',
        bossName: '未来之影',
        bossEnglishName: 'Future Shadow',
        description: '学习计划和未来的词汇',
        words: [
          { e: 'later', c: '后来' },
          { e: 'duck', c: '鸭子' },
          { e: 'pond', c: '池塘' },
          { e: 'cloud', c: '云' },
          { e: 'dry', c: '干的' },
          { e: 'stay', c: '停留' },
          { e: 'later', c: '后来' },
          { e: 'dark', c: '黑暗的' }
        ]
      },
      {
        name: 'Module 5',
        theme: '校园生活',
        bossName: '毕业精灵',
        bossEnglishName: 'Graduation Sprite',
        description: '学习校园生活和毕业相关的词汇',
        words: [
          { e: 'wish', c: '愿望，希望' },
          { e: 'best wishes', c: '最美好的祝愿' },
          { e: 'primary school', c: '小学' },
          { e: 'message', c: '消息' },
          { e: 'keep', c: '保留' },
          { e: 'forever', c: '永远' },
          { e: 'joy', c: '欢乐' },
          { e: 'future', c: '未来' },
          { e: 'wonderful', c: '精彩的' },
          { e: 'good luck', c: '祝你好运' },
          { e: 'proud', c: '自豪的' }
        ]
      }
    ]
  }
];

// ========== Generator ==========

function determineDifficulty(word) {
  const len = word.length;
  if (len <= 3) return 1;
  if (len <= 5) return 2;
  if (len <= 8) return 3;
  return 4;
}

function guessCategory(word) {
  // Basic heuristic based on common word endings and meanings
  const lower = word.toLowerCase();
  if (/\b(am|is|are|was|were|be|can|will|do|does|did|have|has|had|go|went|come|came|run|ran|eat|ate|drink|drank|see|saw|take|took|make|made|fly|swim|swam|sing|sang|ride|rode|write|wrote|buy|bought|give|gave|teach|taught|learn|learnt|speak|think|feel|hear|find|found|put|cut|read|tell|told|say|get|bring|send|begin|start|finish|stop|play|like|love|want|need|try|miss|hope|wish)\b/i.test(lower)) return 'verb';
  if (/\b(i|you|he|she|it|we|they|me|him|her|us|them|my|your|his|its|our|their|this|that|these|those|who|what|whose|which)\b/i.test(lower)) return 'pronoun';
  if (/\b(the|a|an)\b/i.test(lower)) return 'article';
  if (/\b(in|on|at|to|for|of|with|from|by|about|into|before|after|between|under|behind|near|above|along|around|inside|beside|next to)\b/i.test(lower)) return 'preposition';
  if (/\b(and|or|but|because|so|then|when)\b/i.test(lower)) return 'conjunction';
  if (/(ly|ily)$/i.test(lower)) return 'adverb';
  if (/(ful|ous|ive|able|ible|al|y|ish|less|ic|ed|ing)$/i.test(lower) && !/\b(old|good|bad|big|small|tall|short|long|new|young|cold|hot|cool|warm|dark|light|fast|slow|high|low|fat|thin|clean|dirty|happy|sad|angry|kind|nice|fine|well|ill|easy|hard|heavy|lucky|ready)\b/i.test(lower)) return 'adjective';
  if (/\b(old|good|bad|big|small|tall|short|long|new|young|cold|hot|cool|warm|dark|light|fast|slow|high|low|fat|thin|clean|dirty|happy|sad|angry|kind|nice|fine|well|ill|easy|hard|heavy|lucky|ready|beautiful|hungry|thirsty|tired|bored|different|famous|interesting|fantastic|great|delicious|dangerous|special|difficult|traditional|foreign|useful|broken|healthy|clever|cute|naughty|merry|quiet|safe|lucky|proud|wonderful|sunny|cloudy|windy|frightened|nervous|busy|late|early|lost|blind|deaf|strong|weak|lovely)\b/i.test(lower)) return 'adjective';
  if (/s$/.test(lower) && !/ss$/.test(lower)) return 'noun';
  return 'other';
}

function generateWordFile(textbook) {
  const { id, name, shortName, modules } = textbook;
  const units = [];
  const words = [];

  modules.forEach((mod, mi) => {
    const unitNum = mi + 1;
    const unitId = `${id}-m${unitNum}`;
    const unit = {
      id: unitId,
      name: mod.name,
      shortName: `M${unitNum}`,
      order: unitNum,
      theme: mod.theme,
      bossName: mod.bossName,
      bossEnglishName: mod.bossEnglishName,
      description: mod.description
    };
    units.push(unit);

    mod.words.forEach((w, wi) => {
      const wordId = `${unitId}-${String(wi + 1).padStart(3, '0')}`;
      words.push({
        id: wordId,
        english: w.e,
        chinese: w.c,
        phonetic: '',
        partOfSpeech: '',
        unitId: unitId,
        unitName: mod.name,
        difficulty: determineDifficulty(w.e),
        isKey: true,
        category: guessCategory(w.e),
        exampleSentence: ''
      });
    });
  });

  const lines = [];
  lines.push(`// === ${name} Word Data ===`);
  lines.push(`// Generated from primary school vocabulary list (外研版 三年级起点).`);
  lines.push(`// ${words.length} words across ${units.length} units.`);
  lines.push('');
  lines.push(`export const TEXTBOOK_META = {`);
  lines.push(`  id: "${id}",`);
  lines.push(`  name: "${name}",`);
  lines.push(`  shortName: "${shortName}",`);
  lines.push(`  unitCount: ${units.length},`);
  lines.push(`  totalWords: ${words.length}`);
  lines.push(`};`);
  lines.push('');
  lines.push(`export const UNITS = ${JSON.stringify(units, null, 2)};`);
  lines.push('');
  lines.push(`export const WORDS = [`);

  for (const w of words) {
    lines.push(`  {`);
    lines.push(`    id: "${w.id}",`);
    lines.push(`    english: ${JSON.stringify(w.english)},`);
    lines.push(`    chinese: ${JSON.stringify(w.chinese)},`);
    lines.push(`    phonetic: "",`);
    lines.push(`    partOfSpeech: "",`);
    lines.push(`    unitId: "${w.unitId}",`);
    lines.push(`    unitName: "${w.unitName}",`);
    lines.push(`    difficulty: ${w.difficulty},`);
    lines.push(`    isKey: ${w.isKey},`);
    lines.push(`    category: "${w.category}",`);
    lines.push(`    exampleSentence: ""`);
    lines.push(`  },`);
  }

  lines.push(`];`);
  lines.push('');

  return lines.join('\n');
}

// ========== Main ==========

function main() {
  console.log('=== Primary School Word Generator ===\n');

  const dataDir = path.join(__dirname, '..', 'data');
  let totalWords = 0;

  for (const tb of TEXTBOOKS) {
    const content = generateWordFile(tb);
    const outputPath = path.join(dataDir, `words-${tb.id}.js`);
    fs.writeFileSync(outputPath, content, 'utf-8');

    const wordCount = tb.modules.reduce((sum, m) => sum + m.words.length, 0);
    totalWords += wordCount;
    console.log(`  ${tb.id}: ${tb.modules.length} modules, ${wordCount} words -> ${outputPath}`);
  }

  console.log(`\nTotal: ${TEXTBOOKS.length} textbooks, ${totalWords} words`);
  console.log('\n=== Done ===');
}

main();
