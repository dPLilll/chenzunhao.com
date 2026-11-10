import { Page, Section, Text, Button, Toggle, Select, Segmented, useGrokTheme, useState, useEffect } from "../ui/canvas";
import type { ChangeEvent } from "../ui/canvas";

type SlotKey = "camera" | "pose" | "face" | "makeup" | "bottom" | "inner" | "shoe" | "palette" | "acc" | "scene" | "light";
type Vals = Record<SlotKey, string[]>;
type Locks = Record<SlotKey, boolean>;
type PoolKey = SlotKey | "pal0" | "pal1" | "pal2" | "pal3";
type Pools = Record<PoolKey, string[]>;
type Snap = { vals: Vals; tpl: number };
type SlotDef = { key: SlotKey; label: string; min: number; max: number; recent: number };

const SLOTS: SlotDef[] = [
  { key: "camera", label: "机位", min: 1, max: 1, recent: 2 },
  { key: "pose", label: "姿态与动作", min: 1, max: 1, recent: 3 },
  { key: "face", label: "模特长相", min: 1, max: 1, recent: 4 },
  { key: "makeup", label: "妆容", min: 1, max: 1, recent: 3 },
  { key: "bottom", label: "下装", min: 1, max: 1, recent: 5 },
  { key: "inner", label: "内搭", min: 1, max: 1, recent: 2 },
  { key: "shoe", label: "鞋型", min: 1, max: 1, recent: 2 },
  { key: "palette", label: "配色方案", min: 1, max: 1, recent: 3 },
  { key: "acc", label: "配饰", min: 1, max: 2, recent: 1 },
  { key: "scene", label: "场景", min: 1, max: 1, recent: 5 },
  { key: "light", label: "光线", min: 1, max: 1, recent: 2 },
];

const DEFAULT_POOLS: Pools = {
  camera: [
    "齐胸平拍",
    "齐胸高度、从人物左前方45度侧面拍摄",
    "齐胸高度、从人物右前方45度侧面拍摄",
    "略低于腰部、轻微仰拍",
    "略高于胸口、轻微俯拍",
    "齐胸高度、近乎正侧面拍摄",
  ],
  pose: [
    "迈步向前，转头看镜头、嘴角微扬｜保持迈步的姿态，转头看向镜头，嘴角的笑意慢慢加深",
    "身体微侧，单手插在口袋里，转头看镜头、嘴角微扬｜手仍插在口袋里，肩膀放松地轻轻一晃，侧头看向镜头",
    "低头用一只手整理衣襟，神情放松、嘴角微扬｜先低头整理衣襟，随即抬眼看向镜头，露出浅浅的笑",
    "侧身站立，下巴微抬，看向远处｜目光从远处缓缓转回，看向镜头，嘴角微扬",
    "迈步向前走，手臂自然摆动，目光看向前方｜继续自然向前走，随后侧头看向镜头",
    "重心落在一条腿上，身体微侧，一只手自然垂放，正跟拍照的朋友说话，转头看镜头｜说完笑了一下，随即迈出步子",
    "停步回头，上身半侧向镜头，嘴角微扬｜保持回头的姿态，微微一笑，随后转回身迈步",
    "双脚自然错开站定，身体放松，转头看镜头、笑意轻浅｜从站定的姿态迈开步子，边走边看向镜头",
    "单手腕轻搭在高腰位，身体微侧，转头看镜头、嘴角微扬｜手腕仍搭在腰间，轻轻转身，目光看向镜头，笑意加深",
    "微微侧身回头，肩膀放松，目光回望镜头｜保持回头的姿态，轻轻一笑，随后迈出步子",
    "走着走着被朋友叫住，回头看向镜头，一只手自然垂放，笑意自然｜保持回头的姿态，笑了一下，随后继续迈步",
    "重心落在后腿上，前腿微屈、脚尖轻点地面，转头看镜头｜从站定的姿态迈出一步，边走边看向镜头",
    "【坐/台阶、楼梯/开】坐在{座}，一条腿向前伸直、另一条腿微屈，双手自然搭在膝上，转头看镜头、嘴角微扬｜先望向远处，再转头看向镜头，笑意慢慢加深",
    "【坐/长凳】侧坐在{座}，双腿交叠，上身微微后倾，一只手轻撑在凳面上，转头看镜头｜先看向画面外，再转回头看向镜头，嘴角微扬",
    "【坐/矮墙、台阶】坐在{座}，双膝并拢、小腿斜向一侧，双手轻扶着边沿，看向镜头、嘴角微扬｜低头看了一眼脚边，再抬眼看向镜头，笑意浅浅",
    "【蹲/无/开】半蹲在地面上，低头整理鞋子，一只手扶着鞋面，抬头看镜头｜先低头整理鞋子，随后抬头看向镜头，嘴角微扬",
    "【靠/栏杆】斜靠在{座}，一侧肩膀轻倚，双腿交叉，一只手插在口袋里，转头看镜头｜先侧头看向远处，再转头看向镜头，嘴角微扬，随后直起身迈出一步",
    "【坐/便利店】坐在便利店门口的台阶上，双腿并拢、斜向一侧，双手捧着一杯热饮，抬眼看镜头｜低头抿一口热饮，再抬眼看向镜头，嘴角微扬",
    "【坐/楼梯、台阶】坐在{座}，上身微微前倾，双臂搭在膝上，双腿并拢，抬头看镜头｜先低头看着地面，再抬头看向镜头，嘴角微扬",
    "【蹲/堤道/开】蹲坐在海边堤道的步道上，双手环抱膝盖，下巴轻靠在臂弯里，转头看镜头｜先望向远处的海面，再转头看向镜头，笑意轻浅",
    "【坐/长凳、台阶、矮墙】坐在{座}，双腿并拢，脚尖轻点地面，双手撑在身侧，上身微微后仰，看向镜头｜先抬头望向远处，再转回头看向镜头，嘴角微扬",
    "【坐/台阶、长凳、矮墙】坐在{座}，双腿交叠，一只手搭在膝上，另一只手自然放在身侧，正跟拍照的朋友说话，笑着看向镜头｜笑意慢慢加深，眼神从旁边移向镜头",
    "【坐/长凳、台阶、楼梯】坐在{座}，身体微侧，一只手撑在身后，另一只手自然搭在膝上，双腿并拢，笑着看向镜头｜听到朋友说了句什么，笑着转头看向镜头，嘴角微扬",
    "【靠/栏杆】双肘轻搭在{座}，身体微侧，转头看镜头、嘴角微扬｜先看向远处，再侧头看向镜头，随后直起身迈出步子",
    "单手举着手机在身前自拍，目光看向手机屏幕，自然带笑｜保持自拍的姿态，随后放下手机，转头看向镜头，嘴角微扬",
    "一手端着一杯热咖啡在腰侧，低头抿一口，再抬眼看镜头，另一只手自然垂放｜先低头抿一口咖啡，再抬眼看向镜头，笑意浅浅",
    "一手拿着冰淇淋甜筒，刚咬了一口，手肘微收，眼睛看向镜头｜低头又吃了一口冰淇淋，随后笑着看向镜头",
    "双手自然垂在身侧，身体微微后倾，被朋友逗笑了，笑着看向镜头｜笑着摇了摇头，随后迈出步子，转头看向镜头",
    "一只手轻掩在嘴边，像刚听完朋友的玩笑，忍不住笑，身体微侧，看向镜头，另一只手自然垂放｜手放下来，轻轻一笑，随后迈出步子，转头看向镜头",
    "【站//开】重心落在一条腿上，另一只脚脚尖点地，身体微侧，双手自然垂放，转头看镜头、笑意自然｜脚轻轻落下，随后迈出步子，转头看向镜头，笑意加深",
    "【坐/台阶、长凳、矮墙】坐在{座}，一手端着一杯咖啡放在膝上，另一只手自然搭在膝边，笑着跟朋友说话，看向镜头｜低头抿一口咖啡，再抬眼看向镜头，嘴角微扬",
    "【蹲/台阶/开】蹲在{座}，手肘搭在膝上，双手自然交握，正跟拍照的朋友说话，抬头看镜头｜先低头笑了笑，再转头看向镜头，笑意加深",
    "【坐/栏杆/开】侧坐在{座}，一只脚踩在下方的横杆上，一只手扶着栏杆，转头看镜头｜先看向远处，再转头看向镜头，嘴角微扬",
    "【坐/长凳、台阶】坐在{座}，身体微侧，一手拿着纸杯咖啡，头微偏看向一侧｜先看向一侧，再转头看向镜头，嘴角微扬",
    "【坐/长凳、台阶、矮墙】坐在{座}，身体侧对镜头，一手托腮，目光看向一侧｜保持托腮的姿态，眼神慢慢移向镜头，浅浅一笑",
    "【坐/台阶、楼梯】坐在{座}，一只手轻轻拉着衣领或帽檐靠近脸颊，看向镜头｜手仍轻扶着衣领，看向镜头，嘴角微扬",
    "【坐/长凳】坐在{座}，身体前倾，一只手托腮，看向镜头｜保持托腮的姿态，笑意浅浅",
    "【坐/无/开】坐在地面上，一条腿屈起，上身放松，看向镜头｜保持坐姿，看向镜头，嘴角微扬",
    "【坐/长凳、台阶、矮墙】坐在{座}，低头看手机，神情放松｜先低头看手机，再抬眼看向镜头，嘴角微扬",
    "一只手抬起抚头发，微笑看向镜头，另一只手自然垂放｜指尖把发丝拨到耳后，随后看向镜头，嘴角微扬",
    "走在路上，一手端着咖啡杯和托碟，身体微侧，目光看向斜前方｜继续向前走，随后侧头看向镜头，嘴角微扬",
    "双手插在衣兜里，身体微侧，目光看向一侧｜保持双手插兜，随后侧头看向镜头，嘴角微扬",
    "【靠/矮墙】一只手扶着{座}，手里拿着咖啡杯，身体微侧，看向镜头｜保持倚靠的姿态，看向镜头，嘴角微扬",
    "双手插在衣兜里，身体正对镜头，看向镜头｜保持双手插兜，看向镜头，嘴角微扬",
    "【坐/矮墙、长凳】坐在{座}，一只手撑在身侧，另一只手举着手机，看向镜头｜保持坐姿，看向镜头，嘴角微扬",
    "【坐/床】单膝跪在{座}，双手插在衣兜里，看向镜头｜保持跪坐的姿态，看向镜头，嘴角微扬",
    "单手举着手机挡住部分面部自拍，身体正对镜子｜保持自拍的姿态，随后稍微挪开手机，看向镜头，嘴角微扬",
    "【坐/长凳】坐在{座}，双腿自然向前放，上身放松，看向镜头｜保持坐姿，看向镜头，嘴角微扬",
  ],
  face: [
    "圆润鹅蛋脸，双眼皮圆眼，茶棕色慵懒大波浪长发，脸侧有细碎发丝",
    "小巧瓜子脸，清澈内双大眼，栗棕色大波浪长卷发，配轻薄空气刘海",
    "小圆脸，无辜圆眼睛，亚麻茶棕色大波浪长发，两侧有细碎鬓发",
    "小脸，微上扬的猫系双眼皮，焦糖茶棕色慵懒长卷发，额前有碎发",
    "清秀鹅蛋脸，笑起来有卧蚕的月牙眼，栗棕色大波浪长发，一侧别在耳后",
    "偏圆小脸，自然内双杏仁眼，深茶棕色长波浪卷发配外八字刘海",
    "秀气心形脸，眼尾微垂的无辜眼，浅茶棕色大波浪长发，脸侧有碎发",
    "鹅蛋脸，带一点酷感的内双眼，深栗棕色大波浪长卷发配外八字刘海",
    "小脸，大而有神的眼睛，黑棕色小羊卷中长发，额前有碎发",
    "小圆脸，双眼皮杏眼，奶茶棕色中长发半扎，两侧有碎发",
    "小巧鹅蛋脸，卧蚕笑眼，深棕色中长直发配公主切",
    "小巧瓜子脸，单眼皮微上扬，黑色及肩短发配齐刘海",
    "小圆脸，双眼皮圆眼，深棕色双低马尾辫，耳边有细碎发丝",
  ],
  makeup: [
    "韩系淡妆，眉毛自然修整，眼妆清淡，唇色接近本色",
    "暖调自然妆，眉毛清晰，浅桃色腮红，唇色是柔雾裸粉色",
    "日常薄妆，眉毛清晰，腮红很淡，唇色是雾面裸棕色",
    "水光肌妆，苹果肌打浅桃色腮红，眉毛清晰有型，唇色是水光粉色",
    "粉嫩妆，苹果肌和鼻尖带一点粉色，眉毛细而清晰，唇色是水光玫粉色",
    "冷调薄妆，眉毛又直又清晰，眼妆几乎不加，唇色是哑光裸米色",
  ],
  bottom: [
    "高腰百褶中裙，裙长到膝盖",
    "高腰格纹百褶中裙，格纹只用两种配色，裙长到膝盖",
    "高腰蓬蓬蛋糕中裙，裙摆层叠蓬松，裙长到膝盖",
    "高腰奶白色A字中裙，裙摆带细褶边，裙长到膝盖",
    "高腰牛仔中裙，修身，裙长到膝盖",
    "高腰A字毛呢中裙，裙长刚过膝盖",
    "高腰灯芯绒A字中裙，裙长到膝盖",
    "高腰百褶短裙，裙长到大腿中部",
    "高腰格纹百褶短裙，格纹只用两种配色，裙长到大腿中部",
    "高腰蓬蓬蛋糕短裙，裙摆层叠蓬松，裙长到大腿中部",
    "高腰奶白色A字短裙，裙摆带细褶边，裙长到大腿中部",
    "高腰牛仔短裙，修身，裙长到大腿中部",
    "高腰灯芯绒A字短裙，裙长到大腿中部",
    "高腰百褶长裙，裙长及踝",
    "高腰A字毛呢长裙，裙长过膝近小腿中段",
    "高腰牛仔百慕大短裤，裤长到膝盖",
    "高腰毛呢百慕大短裤，裤长到膝盖",
    "阿伯风高腰宽腿裤，腰线收紧，裤长盖住鞋面",
    "高腰破洞宽松牛仔裤，膝盖处有小破洞，裤长到鞋面",
    "高腰修身直筒牛仔裤，裤长到鞋面",
    "高腰微喇牛仔裤，修身显腿长，裤长盖住鞋面",
    "深棕色宽松阔腿裤，裤脚拖到脚面",
    "蓝色做旧直筒牛仔裤，裤长到鞋面",
    "深蓝绛绒阔腿裤，裤脚拖到脚面",
    "橄榄绿阔腿工装气球裤，裤脚拖到脚面",
    "卡其阔腿工装裤，大口袋，裤长到鞋面",
    "深蓝高腰阔腿喇叭牛仔裤，侧缝有装饰线，裤长盖住鞋面",
    "浅蓝阔腿木匠牛仔裤，裤长到鞋面",
    "深靛蓝直筒牛仔裤，裤长到鞋面",
    "黑色过膝百褶中裙，裙长刚过膝盖",
    "咖啡灰阔腿裤，裤脚拖到脚面",
    "燕麦色廓形阔腿卫裤，裤脚拖到脚面",
    "高腰百褶短裙，裙长到大腿中部",
    "高腰格纹百褶短裙，格纹只用两种配色，裙长到大腿中部",
    "高腰蓬蓬蛋糕短裙，裙摆层叠蓬松，裙长到大腿中部",
    "高腰奶白色A字短裙，裙摆带细褶边，裙长到大腿中部",
    "高腰牛仔短裙，修身，裙长到大腿中部",
    "高腰灯芯绒A字短裙，裙长到大腿中部",
    "高腰百褶长裙，裙长及踝",
    "高腰A字毛呢长裙，裙长过膝近小腿中段",
    "深蓝灰高腰阔腿牛仔裤，裤脚拖到脚面",
    "深蓝灰高腰阔腿裤，裤脚拖到脚面",
    "高腰黑色百褶短裙，裙长到大腿中部",
    "高腰灰棕色百褶短裙，裙长到大腿中部",
    "高腰深灰垂坠长半裙，裙长过膝近小腿中段",
    "米白色高腰直筒牛仔裤，裤长到鞋面",
    "高腰深色格纹百褶短裙，格纹只用两种配色，裙长到大腿中部",
    "黑色宽松阔腿卫裤，裤脚拖到脚面",
    "浅粉色宽松阔腿卫裤，裤脚拖到脚面",
    "浅灰色宽松阔腿卫裤，裤脚拖到脚面",
    "高腰绿棕红格纹花苞中长裙，裙长过膝近小腿中段",
    "高腰深灰色百褶短裙，裙长到大腿中部",
    "高腰黑色波点短裙，米色圆点，下摆有黑白条纹织边，裙长到大腿中部",
    "米白色高腰阔腿裤，裤脚拖到脚面",
    "黑色运动短裤，裤长到大腿中部",
    "灰色运动短裤，裤长到大腿中部",
    "浅灰色宽松直筒运动裤，裤长到鞋面",
    "紫红色竖条纹高腰阔腿裤，一侧膝盖有破洞，裤脚拖到脚面",
  ],
  inner: [
    "修身半高领针织衫，领口在颈部中段",
    "罗纹修身长袖上衣，圆领，领口在锁骨上方",
    "方领修身针织衫，领口最低到锁骨下方，贴合胸线，胸口完全遮住",
    "修身高领打底衫，领口贴合颈部",
    "学院风衬衫领叠穿修身针织衫，衬衫领扣好露出翻领，圆领，领口在锁骨上方",
    "修身针织开衫叠穿衬衫领，纽扣扣好，领口在锁骨上方",
    "修身半高领针织开衫，纽扣扣好，领口在颈部中段",
    "短款修身针织开衫，圆领，纽扣扣好，领口在锁骨上方",
    "格纹衬衫扣好，格纹只用两种配色，领口在锁骨上方",
    "简约图案短袖T恤叠穿修身针织背心，圆领，领口在锁骨上方",
    "衬衫配细领带，衬衫扣到最顶、领带系到领口，可叠穿针织背心，领带只用一种配色",
    "红色修身针织衫，圆领，只在领口与前襟露出一小片红色，领口在锁骨上方",
    "米白修身高领打底衫，领口贴合颈部",
    "蓝白横条修身长袖，圆领，领口在锁骨上方",
    "黑白横条半高领，领口在颈部中段",
    "米色华夫格长袖，圆领，领口在锁骨上方",
    "浅粉修身长袖，圆领，领口在锁骨上方",
    "深灰修身长袖，圆领，领口在锁骨上方",
    "米白修身长袖，毛绒袖口自然外露，圆领，领口在锁骨上方",
    "灰色短款圆领T恤，领口在锁骨上方",
    "灰色圆领针织上衣，领口在锁骨上方",
    "棕色横条纹针织衫叠穿浅蓝色条纹衬衫，袖口露出衬衫，圆领，领口在锁骨上方",
    "亮蓝色短款针织开衫叠穿白色打底，圆领，领口在锁骨上方，胸口完全遮住",
    "白色荷叶边上衣，领口在锁骨上方，胸口完全遮住",
    "黑白细条纹长袖，腰间系浅蓝色格子衬衫，圆领，领口在锁骨上方",
    "白色短款圆领T恤，领口在锁骨上方",
    "白色圆领背心，领口在锁骨上方，胸口完全遮住",
    "白色短款圆领上衣，领口在锁骨上方，胸口完全遮住",
    "湖蓝色短款针织开衫，白色纽扣，圆领，领口在锁骨上方，胸口完全遮住",
    "腰间系蓝白细格子衬衫，衣摆在髋侧打结，领口在锁骨上方，胸口完全遮住",
    "红白细格纹荷叶边上衣叠穿白底细条纹与白色荷叶边层层下摆，领口在锁骨上方，胸口完全遮住",
    "黑色短款圆领T恤，领口在锁骨上方",
  ],
  shoe: [
    "圆头厚底乐福鞋",
    "圆头玛丽珍鞋",
    "银白色厚底运动鞋",
    "白色德训鞋",
    "厚底马丁靴",
    "短筒雪地靴",
    "圆头粗跟短靴",
    "绒面及踝靴",
    "圆头切尔西短靴",
    "绒面过膝靴",
    "圆头玛丽珍鞋配针织腿套，堆在脚踝到小腿",
    "银白色厚底运动鞋配针织腿套，堆在脚踝到小腿",
    "浅灰厚袜配棕色麂皮包头穆勒鞋",
    "白色老爹鞋",
    "驼色厚底雪地靴",
    "米色厚底雪地靴拖鞋款",
    "灰白老爹鞋",
    "银灰老爹鞋",
    "驼色厚底毛毛靴配针织腿套，堆在脚踝到小腿",
    "深棕色圆头乐福鞋配白色中筒袜",
    "深棕色圆头系带乐福鞋配白色中筒袜",
    "黑色圆头乐福鞋配白色堆堆袜",
    "卡其色磨砂高筒靴，深棕色皮带扣，配白色中筒袜",
    "米杏色磨砂高筒靴，深棕色皮带扣，配白色中筒袜",
    "黑色带扣短靴",
    "黑色厚底运动鞋",
    "奶油色厚底毛毛雪地靴",
    "棕色圆头浅口绑带鞋，米白色交叉鞋带，配橄榄绿中筒袜",
    "米杏色磨砂高筒靴，深棕色皮带扣，配白色堆堆袜",
    "黑色厚底毛毛雪地靴，靴筒上有银色铆钉装饰，配白色堆堆袜",
    "黑色低帮板鞋，白色厚底",
    "深棕色勃肯软木包头拖鞋，皮带扣，配米白色针织堆堆袜",
    "黑色圆头厚底德比鞋，米白色厚底",
  ],
  palette: [],
  pal0: [
    "焦糖棕与深灰",
    "燕麦色与巧克力棕",
    "浅灰与藏青",
    "橄榄绿与深棕",
    "驼色与黑色",
    "炭灰与酒红",
    "橄榄绿与米白",
    "燕麦色与浅粉",
  ],
  pal1: [
    "藏青与奶白",
    "炭灰与深棕",
    "深咖色与米色",
    "橄榄绿与奶油白",
    "黑色与浅灰",
    "牛仔蓝与白色",
    "深蓝与奶白",
    "炭灰与牛仔蓝",
  ],
  pal2: [
    "奶油白与驼色",
    "浅灰与酒红",
    "燕麦色与深咖色",
    "灰蓝与象牙白",
    "焦糖棕与米白",
    "橄榄绿与奶白",
    "芥末黄与米白",
    "橄榄绿与米白",
  ],
  pal3: [
    "焦糖棕与深灰",
    "燕麦色与巧克力棕",
    "浅灰与藏青",
    "橄榄绿与深棕",
    "驼色与黑色",
    "炭灰与酒红",
    "燕麦色与浅粉",
    "炭灰与牛仔蓝",
  ],
  acc: [
    "一条细链项链，叠戴在领口外侧，吊坠小巧",
    "一对小巧的耳钉",
    "一枚简洁的发夹，别在鬓边",
    "一个细款发箍",
    "一顶针织毛线帽，露出刘海与鬓发，不遮挡眼睛",
    "一顶棒球帽，帽檐微压，不遮挡眼睛",
    "一顶报童帽，露出刘海与鬓发",
    "一条钩花针织头巾，系在头顶",
    "一副头戴式耳机，戴在头顶",
    "一副墨镜，推在头顶，不遮挡眼睛",
    "一条松松搭在颈后的短围巾",
    "一只斜挎的小号帆布包",
    "一只小号双肩包，背带贴合肩部，包上挂着一个小叮当挂件",
    "一只大号托特包，挎在肩侧",
    "一只小号腋下包，夹在一侧手臂下",
    "一条纤细的金属手链",
    "一副细框眼镜",
    "一条红色针织围巾，垂挂在颈前两侧",
    "一只红色小号斜挎包",
    "一条浅粉粗针织毛线围巾，松松围在颈前",
    "一条宝蓝色针织围巾，垂挂在颈前两侧",
    "一只红色双肩包，背带贴合肩部",
    "一只灰色双肩包，背带贴合肩部，包上挂着一个小毛绒挂件",
    "一只黑色单肩帆布包，挎在肩侧",
    "一副细框圆眼镜",
    "一顶深蓝色Polo棒球帽，帽檐微压，不遮挡眼睛",
    "一顶深棕NY棒球帽，帽檐微压，不遮挡眼睛",
    "一只粉底黑波点大托特，挎在肩侧，包上挂着一个小毛绒公仔",
    "一只豹纹托特，挎在肩侧，包上挂着一个小毛绒公仔",
    "一只棕蓝格托特，挎在肩侧",
    "一条芥末黄格纹围巾，松松搭在颈前",
    "一条红白横条围巾，垂挂在颈前两侧",
    "一条薄荷绿小围巾，松松围在颈前",
    "一条深棕豹纹大围巾，松松搭在颈前",
    "一条深蓝北欧花纹围巾，垂挂在颈前两侧",
    "一只红色小号腋下包，夹在一侧手臂下",
    "一只驼色小肩包，挎在肩侧",
    "一条黑色细腰带，系在腰间",
    "一只黑色手提包，挎在肩侧，包上挂着浅蓝白色小挂件",
    "一只酒红色带扣双肩包，背带贴合肩部",
    "一顶灰色字母针织冷帽，露出刘海与鬓发，不遮挡眼睛",
    "一顶黑色字母针织冷帽，露出刘海与鬓发，不遮挡眼睛",
    "一只浅黄色手提包，挎在肩侧",
    "一只棕色大号托特包，挎在肩侧",
    "一只棕色手提包，拎在身前",
    "一条米底深色提花针织发带，戴在额头，不遮挡眼睛",
    "一条深色提花围巾，松松围在颈前",
    "一只浅黄色保龄球包，放在身旁或挎在肩侧",
    "一顶深蓝色NY棒球帽，帽檐微压，不遮挡眼睛",
    "一副白色耳罩，戴在耳朵上，不遮挡眼睛",
    "一只浅蓝色大号托特包，挎在肩侧，包上挂着一个白色毛球挂件",
    "一顶驼色报童帽，露出刘海与鬓发，不遮挡眼睛",
    "两枚银色发夹，别在一侧头发上",
    "一只黑色猫咪造型毛绒包，放在身旁或挎在肩侧",
    "一顶黑白条纹针织冷帽，露出刘海与鬓发，不遮挡眼睛",
    "一双黑色短手套",
    "一顶做旧灰色棒球帽，帽檐微压，不遮挡眼睛",
    "一只灰色抽绳双肩包，背在一侧肩上",
  ],
  light: [
    "傍晚夕阳的暖金色侧逆光，发丝与衣缘呈暖金色，面部有来自地面与墙面的反射光",
    "晴天午后的斜射阳光，天空湛蓝，光线从侧前方自然落在人物身上，投影清晰，地面与墙面有真实的反光",
    "蓝调时刻，天空是深蓝色，暖色店铺灯光与路灯自然落在人物身上，地面与墙面有微弱的反光",
    "日落后橘粉色的晚霞天光，天空由橘红渐变到粉紫，暖橘色天光落在人物身上，影子很淡",
    "雾白奶油色调，柔和的散射日光，偏奶油、米白、浅粉的低饱和柔雾感，阴影很浅，肤色白皙自然，轻微柔焦",
    "低保真数码相机感，早期CCD卡片机闪光灯随手抓拍，画面带轻微模糊、细腻颗粒与偏色，可带轻微运动拖影",
    "室内顶灯的暖白光，光线柔和均匀地从上方落在人物身上，地面有淡淡的反光，色温偏暖不发青",
  ],
  scene: [
    "首尔住宅区红砖楼外墙，暗红色砖墙浅景深虚化，地面浅灰水泥",
    "书店橱窗前，深木色窗框浅景深虚化",
    "面包房木门前，原木色木门浅景深虚化",
    "地铁站出口，白色瓷砖墙浅景深虚化",
    "天桥上，浅灰桥面与银灰护栏浅景深虚化",
    "小巷水泥台阶，浅灰水泥墙与三级台阶浅景深虚化",
    "老式电影院门口，米色外墙浅景深虚化",
    "便利店门口，白色铝框玻璃门浅景深虚化",
    "停车场入口，浅灰混凝土立柱浅景深虚化",
    "海边堤道，灰白石砌矮墙浅景深虚化",
    "白色美术馆外墙，大面积哑光白墙留白，浅景深",
    "冬季人行道，浅灰砖石墙浅景深虚化",
    "高架桥下，浅灰混凝土桥墩浅景深虚化",
    "日式住宅街角，米色外墙浅景深虚化",
    "无人洗衣店门口，白色外墙浅景深虚化",
    "深灰蓝色卷帘门前，金属卷帘门浅景深虚化",
    "日式木造住宅外墙，深棕色木板墙浅景深虚化",
    "日式咖啡店门口，木框玻璃门浅景深虚化",
    "韩式小店街角，浅石材墙面浅景深虚化",
    "大学校园红砖教学楼前，暗红色砖墙浅景深虚化，空无一人",
    "大学图书馆台阶前，米色石材外墙与宽浅灰台阶浅景深虚化",
    "校门口小吃街，浅灰水泥墙浅景深虚化，无行人",
    "弘大街角，奶油色砖墙浅景深虚化",
    "大学路奶茶店门口，奶油色外墙浅景深虚化，无排队",
    "弘大卷帘门前，银色金属卷帘门浅景深虚化，无行人",
    "弘大人行横道，深灰柏油路浅景深虚化，无车辆行人",
    "弘大混凝土墙前，浅灰清水混凝土墙浅景深虚化",
    "弘大黑色墙面前，黑色墙面浅景深虚化，无行人",
    "弘大红砖墙前，暗红色砖墙浅景深虚化",
    "弘大铁艺护栏旁，黑色铁艺护栏浅景深虚化，无行人",
    "弘大白色店面门口，白色外墙浅景深虚化，无行人",
    "圣水洞红砖仓库外墙，暗红色砖墙浅景深虚化，无行人",
    "大学校园石阶旁，宽阔浅灰石阶浅景深虚化，空无一人",
    "汉江边的水泥台阶，浅灰台阶浅景深虚化，无行人",
    "室内超市员工通道，米色墙面浅景深虚化，她手提灰色购物篮，无其他顾客",
    "室内电梯轿厢，银色电梯门浅景深虚化，她手持配小熊卡通壳的手机对着镜面自拍",
    "街边白色小屋外，浅灰沥青路面浅景深虚化",
    "白砖墙外，白色窗框浅景深虚化",
    "咖啡馆外摆区，深色玻璃橱窗旁有一段浅色矮墙，原木色长凳浅景深虚化",
    "便利店玻璃橱窗前，门内饮料冷柜浅景深虚化",
    "浅色瓷砖外墙边的矮墙，白色窗框浅景深虚化",
    "室内卧室，蓝白红条纹床单浅景深虚化",
    "室内旅店客房，原木色边柜与台灯，旁边有浅色沙发浅景深虚化",
    "红砖墙外人行道，原木色长凳浅景深虚化",
  ],
};

type Jacket = { name: string; word: string; hex: string; ink: string; kind: "collarless" | "hooded" };
const JACKETS: Jacket[] = [
  { name: "米白", word: "米白色", hex: "#F1EBDD", ink: "#222222", kind: "collarless" },
  { name: "芥末黄", word: "芥末黄色", hex: "#D8A826", ink: "#222222", kind: "collarless" },
  { name: "黑色", word: "黑色", hex: "#1D1D1F", ink: "#FFFFFF", kind: "collarless" },
  { name: "米白连帽", word: "米白色", hex: "#F1EBDD", ink: "#222222", kind: "hooded" },
];

const JACKET_IMG: string[] = [
  "data:image/jpeg;base64,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",
  "data:image/jpeg;base64,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",
  "data:image/jpeg;base64,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",
  "data:image/jpeg;base64,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",
];

/** Logo朝向：实体服装正向可读，镜中倒影可镜像 */
const LOGO_ORIENT =
  "Champion左胸草写标志（蓝字配红C）与左袖小C标的位置、朝向与参考图一致，字母与C标正向可读，不可左右镜像反转；若出现镜面反射，镜中倒影允许镜像，但人物实体服装上的标志必须保持正向";
const LOGO_MIRROR_EXTRA = "镜面自拍时以实体服装标志为准，不要把实体Logo画成镜像字";

function jacketPrompt(J: Jacket): string {
  if (J.kind === "hooded") {
    return "Champion连帽短款羽绒服，颜色为" + J.word + "，连帽，同色拉链门襟，左胸Champion草写标志（蓝字配红C），左袖小C标，横向规则绗缝格，袖口与下摆收紧。帽子可自然戴在头上或垂在背后。还原版型、衣长与蓬松度，不添加设计、文字或标志。拉链门襟与左胸标志始终清晰可见，不被手臂、手持物、配饰或座位遮挡。" + LOGO_ORIENT + "。";
  }
  return "Champion无领短款羽绒服，颜色为" + J.word + "，自然敞开，同色按扣门襟，左胸贴袋带Champion草写标志，左袖小C标，袖口与下摆收紧，面料为不规则压胶绗缝而非横格。还原版型、衣长与蓬松度，不添加设计、文字或标志。门襟与左胸贴袋始终清晰可见，不被手臂、手持物、配饰或座位遮挡。" + LOGO_ORIENT + "。";
}
function jacketVis(J: Jacket): string {
  return J.kind === "hooded"
    ? "不添加设计、文字或标志。拉链门襟与左胸标志始终清晰可见，不被手臂、手持物、配饰或座位遮挡。" + LOGO_ORIENT + "。"
    : "不添加设计、文字或标志。门襟与左胸贴袋始终清晰可见，不被手臂、手持物、配饰或座位遮挡。" + LOGO_ORIENT + "。";
}
function jacketShort(J: Jacket): string {
  return J.kind === "hooded" ? "Champion连帽短款羽绒服" : "Champion无领短款羽绒服";
}

const DEFAULT_VIDEO_HINT = "承接参考图的姿态自然动起来，随后侧头看向镜头";

function rnd(n: number): number {
  return Math.floor(Math.random() * n);
}

function shuffle(arr: string[]): string[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = rnd(i + 1);
    const t = a[i];
    a[i] = a[j];
    a[j] = t;
  }
  return a;
}

function pickOne(pool: string[], recent: string[], n: number): string {
  if (pool.length === 0) return "";
  for (let k = Math.min(n, recent.length); k >= 0; k--) {
    const ban = recent.slice(0, k);
    const c = pool.filter((x) => ban.indexOf(x) < 0);
    if (c.length > 0) return c[rnd(c.length)];
  }
  return pool[rnd(pool.length)];
}

function pickMany(pool: string[], min: number, max: number, prev: string[]): string[] {
  const cnt = Math.min(pool.length, min + rnd(max - min + 1));
  const fresh = shuffle(pool.filter((x) => prev.indexOf(x) < 0));
  const rest = shuffle(pool.filter((x) => prev.indexOf(x) >= 0));
  return fresh.concat(rest).slice(0, cnt);
}

function drawSlot(def: SlotDef, pools: Pools, history: Snap[], jacket: number): string[] {
  const pool = def.key === "palette" ? pools[("pal" + jacket) as PoolKey] : pools[def.key];
  if (def.max === 1) {
    const recent = history.map((h) => (h.vals[def.key] || [])[0] || "");
    return [pickOne(pool, recent, def.recent)];
  }
  const prev = history[0] ? history[0].vals[def.key] || [] : [];
  return pickMany(pool, def.min, def.max, prev);
}

function drawAll(pools: Pools, cur: Vals | null, locks: Locks, history: Snap[], jacket: number): Vals {
  const out = {} as Vals;
  for (const def of SLOTS) {
    if (cur && locks[def.key] && cur[def.key] && cur[def.key].length > 0) out[def.key] = cur[def.key];
    else out[def.key] = drawSlot(def, pools, history, jacket);
  }
  if (!poseOk(out.pose[0] || "", out.bottom[0] || "", out.scene[0] || "")) {
    const p0 = out.pose[0] || "";
    const info = parsePose(p0);
    const recentOf = (k: SlotKey) => history.map((h) => (h.vals[k] || [])[0] || "");
    if (!poseOk(p0, "", out.scene[0] || "") && !locks.scene) {
      const c = pools.scene.filter((s) => poseOk(p0, "", s));
      if (c.length > 0) out.scene = [pickOne(c, recentOf("scene"), 5)];
    }
    if (info.open && SHORT_SKIRT.test(out.bottom[0] || "") && !locks.bottom) {
      const c = pools.bottom.filter((b) => !SHORT_SKIRT.test(b));
      if (c.length > 0) out.bottom = [pickOne(c, recentOf("bottom"), 5)];
    }
    if ((info.kind === "坐" || info.kind === "蹲") && MINI_SKIRT.test(out.bottom[0] || "") && !locks.bottom) {
      const c = pools.bottom.filter((b) => !MINI_SKIRT.test(b) && poseOk(p0, b, out.scene[0] || ""));
      if (c.length > 0) out.bottom = [pickOne(c, recentOf("bottom"), 5)];
    }
    if (!poseOk(out.pose[0] || "", out.bottom[0] || "", out.scene[0] || "") && !locks.pose) {
      const c = pools.pose.filter((x) => poseOk(x, out.bottom[0] || "", out.scene[0] || ""));
      if (c.length > 0) out.pose = [pickOne(c, recentOf("pose"), 3)];
    }
  }
  if (!SHORT_SKIRT.test(out.bottom[0] || "")) {
    if (!locks.shoe && /过膝|腿套/.test(out.shoe[0] || "")) {
      const alt = pools.shoe.filter((x) => !/过膝|腿套/.test(x));
      if (alt.length > 0) out.shoe = [alt[rnd(alt.length)]];
    }
    if (!locks.acc && out.acc.some((x) => x.indexOf("腿环") >= 0)) {
      const keep = out.acc.filter((x) => x.indexOf("腿环") < 0);
      out.acc = keep.length > 0 ? keep : ["一副细框眼镜"];
    }
  }
  fixJacketBottomContrast(pools, out, locks, jacket, history);
  fixLegAndTie(pools, out, locks, history);
  if (!locks.acc) out.acc = fixAcc(fixHead(pools.acc, out.acc));
  fixRed(pools, out, locks, jacket);
  if (!locks.light) {
    const okL = pools.light.filter((x) => lightOk(x, out.scene[0] || ""));
    const softL = okL.filter((x) => SOFT_RE.test(x));
    const denseL = okL.filter((x) => !SOFT_RE.test(x));
    const usePool = softL.length > 0 && (denseL.length === 0 || Math.random() < 0.2) ? softL : denseL;
    if (usePool.length > 0) out.light = [pickOne(usePool, history.map((h) => (h.vals.light || [])[0] || ""), 2)];
  }
  if (!lightOk(out.light[0] || "", out.scene[0] || "")) {
    if (!locks.light) {
      const c = pools.light.filter((x) => lightOk(x, out.scene[0] || ""));
      if (c.length > 0) out.light = [pickOne(c, history.map((h) => (h.vals.light || [])[0] || ""), 2)];
    } else if (!locks.scene) {
      const c = pools.scene.filter((s) => lightOk(out.light[0] || "", s) && poseOk(out.pose[0] || "", out.bottom[0] || "", s));
      if (c.length > 0) out.scene = [pickOne(c, history.map((h) => (h.vals.scene || [])[0] || ""), 5)];
    }
  }
  if (armConflict(out.pose[0] || "", out.acc) || (SCENE_HAND_RE.test(out.scene[0] || "") && out.acc.some((x) => ARM_BAG.test(x)))) {
    if (!locks.acc) {
      let keep = out.acc.filter((x) => !ARM_BAG.test(x));
      if (keep.length === 0) {
        const c = pools.acc.filter((x) => !ARM_BAG.test(x) && x.indexOf("包") < 0 && !HEAD_RE.test(x));
        keep = c.length > 0 ? [c[rnd(c.length)]] : ["一副细框眼镜"];
      }
      out.acc = fixAcc(keep);
    } else if (!locks.pose) {
      const c = pools.pose.filter((x) => !armConflict(x, out.acc) && poseOk(x, out.bottom[0] || "", out.scene[0] || ""));
      if (c.length > 0) out.pose = [pickOne(c, history.map((h) => (h.vals.pose || [])[0] || ""), 3)];
    }
  }
  if (SCENE_HAND_RE.test(out.scene[0] || "") && !poseOk(out.pose[0] || "", out.bottom[0] || "", out.scene[0] || "") && !locks.pose) {
    const c = pools.pose.filter((x) => poseOk(x, out.bottom[0] || "", out.scene[0] || "") && !armConflict(x, out.acc));
    if (c.length > 0) out.pose = [pickOne(c, history.map((h) => (h.vals.pose || [])[0] || ""), 3)];
  }
  fixRed(pools, out, locks, -1);
  fixColorHarmony(pools, out, locks, jacket);
  fixStyleHarmony(pools, out, locks, jacket, history);
  if (WIDE_RE.test(out.camera[0] || "") || /0\.5x/.test(out.camera[0] || "")) {
    if (!locks.camera) {
      out.camera = ["齐胸平拍"];
    } else if (parsePose(out.pose[0] || "").kind !== "站" && !locks.pose) {
      const c = pools.pose.filter((x) => parsePose(x).kind === "站" && !armConflict(x, out.acc) && poseOk(x, out.bottom[0] || "", out.scene[0] || ""));
      if (c.length > 0) out.pose = [pickOne(c, history.map((h) => (h.vals.pose || [])[0] || ""), 3)];
    }
  }
  return out;
}

const WIDE_RE = /超广角/;
const RED_RE = /红色/;
const CREAM_RE = /雾白奶油/;
const CCD_RE = /低保真/;
const SOFT_RE = /雾白奶油|低保真/;
const CREAM_BAD = /汉江|路灯|霓虹|夜|傍晚|蓝调/;
function lightText(v: Vals): string {
  const l = v.light[0] || "";
  const sc = v.scene[0] || "";
  if (/汉江/.test(sc)) {
    return l.replace("暖色店铺灯光与路灯", "对岸城市灯火与江边路灯的暖色光").replace("地面与墙面有微弱的反光", "水泥台阶与江面有微弱的灯光倒影").replace("地面与墙面", "水泥台阶与江面");
  }
  if (!/墙/.test(sc)) {
    const hit = NOWALL.find((x) => x[0].test(sc));
    return l.replace("地面与墙面", hit ? "地面与" + hit[1] : "地面与周围的物体表面");
  }
  return l;
}
const NOWALL: [RegExp, string][] = [[/橱窗/, "玻璃"], [/天桥/, "护栏"], [/便利店/, "玻璃门"], [/高架桥/, "桥墩"], [/铁艺护栏/, "护栏"]];
const WHITE_SCENE_RE = /白色(瓷砖|外墙|铝框|店面|美术馆|卷帘)|哑光白墙|奶白|奶油(色|黄)|米色|灰白/;
const BASE_WHITE_NOWALL = "白色羽绒服保留绗缝纹理，不过曝成死白";
function baseWhite(v: Vals): string {
  const sc = v.scene[0] || "";
  return WHITE_SCENE_RE.test(sc) && /墙/.test(sc) ? BASE_WHITE : BASE_WHITE_NOWALL;
}
const BASE_WHITE = "白色羽绒服与白墙保留绗缝和墙面纹理，不过曝成死白";
const FLASH_BAD = /纯色背景墙|校园|大学图书馆|校门口|木质长椅|汉江|堤道|白色美术馆/;

function lightOk(light: string, scene: string): boolean {
  if (/^室内/.test(scene)) return /室内顶灯|低保真/.test(light);
  if (/室内顶灯/.test(light)) return false;
  if (/汉江/.test(scene)) return /夕阳|晚霞|蓝调/.test(light);
  if (CREAM_RE.test(light)) return !CREAM_BAD.test(scene);
  if (/夜间相机直闪/.test(light)) return !FLASH_BAD.test(scene);
  return true;
}

function fixLegAndTie(pools: Pools, out: Vals, locks: Locks, history: Snap[]): void {
  const recentOf = (k: SlotKey) => history.map((h) => (h.vals[k] || [])[0] || "");
  const isTie = (s: string) => s.indexOf("领带") >= 0;
  const isLW = (s: string) => s.indexOf("腿套") >= 0;
  const pleat = (s: string) => s.indexOf("百褶") >= 0;
  const pose0 = out.pose[0] || "";
  const scene0 = out.scene[0] || "";
  if (isTie(out.inner[0] || "") && !pleat(out.bottom[0] || "")) {
    if (!locks.inner) {
      const c = pools.inner.filter((x) => !isTie(x));
      if (c.length > 0) out.inner = [pickOne(c, recentOf("inner"), 2)];
    } else if (!locks.bottom) {
      const c = pools.bottom.filter((b) => pleat(b) && poseOk(pose0, b, scene0));
      if (c.length > 0) out.bottom = [pickOne(c, recentOf("bottom"), 5)];
    }
  } else if (!isTie(out.inner[0] || "") && pleat(out.bottom[0] || "") && !locks.inner && Math.random() < 0.4) {
    const c = pools.inner.filter(isTie);
    if (c.length > 0) out.inner = [c[rnd(c.length)]];
  }
  const tieNow = isTie(out.inner[0] || "") && pleat(out.bottom[0] || "");
  const bottom0 = out.bottom[0] || "";
  const isSkirt = /裙/.test(bottom0);
  const isWool = /毛呢/.test(bottom0);
  const isPleat = pleat(bottom0);
  if (SHORT_SKIRT.test(bottom0) && !locks.shoe) {
    const cur = out.shoe[0] || "";
    // 毛呢裙少用腿套；腿套池排除运动鞋/德训
    const wantLw = !tieNow && !isWool && Math.random() < 0.28;
    if (wantLw && !isLW(cur)) {
      const c = pools.shoe.filter((x) => isLW(x) && !/(运动鞋|德训)/.test(x));
      if (c.length > 0) out.shoe = [c[rnd(c.length)]];
    } else if ((!wantLw || isWool) && isLW(cur)) {
      const c = pools.shoe.filter((x) => !isLW(x));
      if (c.length > 0) out.shoe = [c[rnd(c.length)]];
    }
    if (tieNow && Math.random() < 0.7) {
      const c = pools.shoe.filter((x) => x.indexOf("乐福") >= 0);
      if (c.length > 0) out.shoe = [c[rnd(c.length)]];
    }
  }
  // 裙+运动鞋/德训+腿套：禁；毛呢偏乐福，百褶可玛丽珍+腿套
  if (isSkirt && !locks.shoe && /(运动鞋|德训)/.test(out.shoe[0] || "") && /腿套/.test(out.shoe[0] || "")) {
    let c: string[] = [];
    if (isWool || !isPleat) {
      c = pools.shoe.filter((x) => /乐福|短靴|雪地靴|马丁/.test(x) && !/腿套/.test(x) && !/(运动鞋|德训)/.test(x));
      if (c.length === 0) c = pools.shoe.filter((x) => /乐福|玛丽珍|短靴/.test(x) && !/(运动鞋|德训)/.test(x));
    } else {
      c = pools.shoe.filter(
        (x) =>
          !/(运动鞋|德训)/.test(x) &&
          ((/玛丽珍/.test(x) && /腿套/.test(x)) ||
            (/毛毛靴/.test(x) && /腿套/.test(x)) ||
            (/乐福|短靴|雪地靴/.test(x) && !/腿套/.test(x)))
      );
    }
    if (c.length > 0) out.shoe = [pickOne(c, recentOf("shoe"), 2)];
  }
  // 毛呢裙若仍带腿套，大概率换乐福/短靴
  if (isSkirt && isWool && !locks.shoe && /腿套/.test(out.shoe[0] || "") && Math.random() < 0.85) {
    const c = pools.shoe.filter((x) => !/腿套/.test(x) && /乐福|短靴|雪地靴|马丁|玛丽珍/.test(x) && !/(运动鞋|德训)/.test(x));
    if (c.length > 0) out.shoe = [pickOne(c, recentOf("shoe"), 2)];
  }
  // 裤装不配裸玛丽珍（含腿套款）；裙装可配
  if (PANTS_RE.test(bottom0) && /玛丽珍/.test(out.shoe[0] || "") && !locks.shoe) {
    const prefer = pools.shoe.filter((x) => !/玛丽珍/.test(x) && /乐福|运动鞋|老爹|雪地靴|马丁|短靴/.test(x));
    const alt = prefer.length > 0 ? prefer : pools.shoe.filter((x) => !/玛丽珍/.test(x));
    if (alt.length > 0) out.shoe = [pickOne(alt, recentOf("shoe"), 2)];
  }
}

function fixRed(pools: Pools, out: Vals, locks: Locks, jacket: number): void {
  const isTie = (s: string) => s.indexOf("领带") >= 0;
  const palRed = /红/.test(out.palette[0] || "");
  const redIn = () => RED_RE.test(out.inner[0] || "");
  const redAcc = () => out.acc.filter((x) => RED_RE.test(x));
  const plainAcc = () => pools.acc.filter((x) => !RED_RE.test(x) && !HEAD_RE.test(x) && !/包|围巾|项链/.test(x));
  const dropAcc = (f: (x: string) => boolean) => {
    const keep = out.acc.filter((x) => !f(x));
    if (keep.length > 0) out.acc = keep;
    else {
      const c = plainAcc();
      out.acc = c.length > 0 ? [c[rnd(c.length)]] : ["一副细框眼镜"];
    }
  };
  const altInner = () => {
    const pleatNow = (out.bottom[0] || "").indexOf("百褶") >= 0;
    const c = pools.inner.filter((x) => !RED_RE.test(x) && (pleatNow || !isTie(x)));
    if (c.length > 0) out.inner = [c[rnd(c.length)]];
  };
  if (!locks.acc) {
    if (palRed || redIn()) dropAcc((x) => RED_RE.test(x));
    else if (redAcc().length > 1) {
      const first = redAcc()[0];
      dropAcc((x) => RED_RE.test(x) && x !== first);
    }
  }
  if (!locks.inner && redIn() && (palRed || redAcc().length > 0)) altInner();
  if (!locks.acc && isTie(out.inner[0] || "")) dropAcc((x) => /围巾|项链/.test(x));
  if (jacket === 2 && !palRed && !redIn() && redAcc().length === 0 && Math.random() < 0.28) {
    const tie = isTie(out.inner[0] || "");
    const opts: string[] = [];
    if (!locks.inner && !tie && pools.inner.some((x) => RED_RE.test(x))) opts.push("inner");
    if (!locks.acc && !tie && pools.acc.some((x) => RED_RE.test(x) && x.indexOf("围巾") >= 0)) opts.push("scarf");
    if (!locks.acc && pools.acc.some((x) => RED_RE.test(x) && x.indexOf("包") >= 0)) opts.push("bag");
    if (opts.length > 0) {
      const t = opts[rnd(opts.length)];
      if (t === "inner") {
        const c = pools.inner.filter((x) => RED_RE.test(x));
        out.inner = [c[rnd(c.length)]];
      } else {
        const c = pools.acc.filter((x) => RED_RE.test(x) && (t === "scarf" ? x.indexOf("围巾") >= 0 : x.indexOf("包") >= 0));
        const heads = out.acc.filter((x) => HEAD_RE.test(x));
        out.acc = heads.slice(0, 1).concat([c[rnd(c.length)]]);
      }
    }
  }
  if (!locks.acc) out.acc = fixAcc(out.acc);
}

/** 整体配色：跳色配饰/内搭必须与色板或外套真实色相；冲突则换普通款 */
function fixColorHarmony(pools: Pools, out: Vals, locks: Locks, jacket: number): void {
  const J = JACKETS[jacket] || JACKETS[0];
  const hue = (out.palette[0] || "") + J.word + J.name;
  const softN = /米白|奶白|燕麦|奶油|浅灰|白|驼|棕|咖|黑|灰/;
  const clashAcc = (x: string): boolean => {
    // 跳色围巾仍严；包/帽对中性色放宽
    if (x.indexOf("浅粉粗针织毛线围巾") >= 0) return !/粉/.test(hue);
    if (x.indexOf("薄荷绿小围巾") >= 0) return !/绿|橄榄/.test(hue);
    if (x.indexOf("芥末黄格纹围巾") >= 0) return !/黄|芥末/.test(hue);
    if (x.indexOf("宝蓝色针织围巾") >= 0 || x.indexOf("深蓝北欧花纹围巾") >= 0) return !/蓝|藏青|牛仔|黑|灰|米白/.test(hue);
    if (x.indexOf("红白横条围巾") >= 0) return !/红/.test(hue);
    if (x.indexOf("深棕豹纹大围巾") >= 0 || x.indexOf("豹纹托特") >= 0) return !(/棕|驼|咖|燕麦|巧克力|深灰|黑/.test(hue) || softN.test(hue));
    if (x.indexOf("粉底黑波点") >= 0) return !(/粉/.test(hue) || softN.test(hue));
    if (x.indexOf("棕蓝格托特") >= 0) return !(/棕|驼|咖|蓝|藏青|牛仔/.test(hue) || softN.test(hue));
    if (x.indexOf("深蓝") >= 0 && x.indexOf("Polo") >= 0) return !(/蓝|藏青|牛仔/.test(hue) || softN.test(hue));
    if (x.indexOf("深棕NY") >= 0) return !(/棕|驼|咖|燕麦|深灰|黑/.test(hue) || softN.test(hue));
    return false;
  };
  const plainAcc = () =>
    pools.acc.filter(
      (x) =>
        !clashAcc(x) &&
        !RED_RE.test(x) &&
        (/眼镜|发夹|细链|发箍|耳钉|手链/.test(x) ||
          x.indexOf("一顶棒球帽，帽檐微压") >= 0 ||
          x.indexOf("一只大号托特包") >= 0)
    );
  if (!locks.acc && out.acc.some(clashAcc)) {
    let keep = out.acc.filter((x) => !clashAcc(x));
    const lostHead = out.acc.some((x) => HEAD_RE.test(x)) && !keep.some((x) => HEAD_RE.test(x));
    if (keep.length === 0) {
      const c = plainAcc();
      keep = c.length > 0 ? [c[rnd(c.length)]] : ["一副细框眼镜"];
    } else if (lostHead) {
      const hat = pools.acc.filter((x) => x.indexOf("一顶棒球帽，帽檐微压") >= 0);
      if (hat.length > 0) keep = keep.concat([hat[0]]);
    }
    out.acc = fixAcc(keep);
  }
  if (!locks.inner) {
    const inner = out.inner[0] || "";
    const innerClash =
      (/浅粉/.test(inner) && !/粉/.test(hue)) ||
      (/蓝白横条/.test(inner) && !/蓝|藏青|牛仔|白|米白|奶白/.test(hue)) ||
      (/亮蓝|湖蓝/.test(inner) && !/蓝|藏青|牛仔|白|米白|奶白|黑|灰|黄|芥末/.test(hue));
    if (innerClash) {
      const isTie = (s: string) => s.indexOf("领带") >= 0;
      const pleatNow = (out.bottom[0] || "").indexOf("百褶") >= 0;
      const ok = (x: string) => {
        if (/浅粉/.test(x) && !/粉/.test(hue)) return false;
        if (/蓝白横条/.test(x) && !/蓝|藏青|牛仔|白|米白|奶白/.test(hue)) return false;
        if (/亮蓝|湖蓝/.test(x) && !/蓝|藏青|牛仔|白|米白|奶白|黑|灰|黄|芥末/.test(hue)) return false;
        if (!pleatNow && isTie(x)) return false;
        return true;
      };
      const c = pools.inner.filter(ok);
      if (c.length > 0) out.inner = [c[rnd(c.length)]];
    }
  }
}

/** 新单品风格配对：运动、花苞裙、波点裙、破洞阔腿等不与冲突单品混搭 */
function fixStyleHarmony(pools: Pools, out: Vals, locks: Locks, jacket: number, history: Snap[]): void {
  const J = JACKETS[jacket] || JACKETS[0];
  const hue = (out.palette[0] || "") + J.word + J.name;
  const recentOf = (k: SlotKey) => history.map((h) => (h.vals[k] || [])[0] || "");
  const pose0 = out.pose[0] || "";
  const scene0 = out.scene[0] || "";
  const bottom = () => out.bottom[0] || "";
  const inner = () => out.inner[0] || "";
  const shoe = () => out.shoe[0] || "";
  const innerOk = (x: string) => {
    if (/\u6d45\u7c89/.test(x) && !/\u7c89/.test(hue)) return false;
    if (/\u84dd\u767d\u6a2a\u6761/.test(x) && !/\u84dd|\u85cf\u9752|\u725b\u4ed4|\u767d|\u7c73\u767d|\u5976\u767d/.test(hue)) return false;
    if (/\u4eae\u84dd|\u6e56\u84dd/.test(x) && !/\u84dd|\u85cf\u9752|\u725b\u4ed4|\u767d|\u7c73\u767d|\u5976\u767d|\u9ed1|\u7070|\u9ec4|\u82a5\u672b/.test(hue)) return false;
    if (bottom().indexOf("\u767e\u8936") < 0 && x.indexOf("\u9886\u5e26") >= 0) return false;
    return true;
  };
  const pickInner = (ok: (x: string) => boolean) => {
    if (locks.inner) return;
    const c = pools.inner.filter((x) => ok(x) && innerOk(x));
    if (c.length > 0) out.inner = [pickOne(c, recentOf("inner"), 2)];
  };
  const pickShoe = (ok: (x: string) => boolean) => {
    if (locks.shoe) return;
    const c = pools.shoe.filter(ok);
    if (c.length > 0) out.shoe = [pickOne(c, recentOf("shoe"), 2)];
  };
  const dropAcc = (bad: (x: string) => boolean) => {
    if (locks.acc) return;
    if (!out.acc.some(bad)) return;
    let keep = out.acc.filter((x) => !bad(x));
    if (keep.length === 0) {
      const c = pools.acc.filter((x) => !bad(x) && !HEAD_RE.test(x) && x.indexOf("\u5305") < 0 && x.indexOf("\u56f4\u5dfe") < 0);
      keep = c.length > 0 ? [c[rnd(c.length)]] : ["\u4e00\u526f\u7ec6\u6846\u773c\u955c"];
    }
    out.acc = fixAcc(keep);
  };
  const pickBottom = (ok: (x: string) => boolean) => {
    if (locks.bottom) return;
    const c = pools.bottom.filter((b) => ok(b) && poseOk(pose0, b, scene0));
    if (c.length > 0) out.bottom = [pickOne(c, recentOf("bottom"), 5)];
  };
  if (/\u8fd0\u52a8\u77ed\u88e4/.test(bottom())) {
    if (!/\u52c3\u80af|\u677f\u978b|\u8fd0\u52a8\u978b|\u5fb7\u8bad|\u8001\u7239|\u96ea\u5730\u9774|\u6bdb\u6bdb\u9774|\u77ed\u9774|\u4e50\u798f/.test(shoe()) || /\u7ed1\u5e26|\u5fb7\u6bd4|\u739b\u4e3d\u73cd/.test(shoe())) {
      pickShoe((x) => /\u52c3\u80af|\u677f\u978b|\u8fd0\u52a8\u978b|\u5fb7\u8bad|\u8001\u7239|\u96ea\u5730\u9774|\u6bdb\u6bdb\u9774|\u77ed\u9774|\u4e50\u798f/.test(x) && !/\u7ed1\u5e26|\u5fb7\u6bd4|\u739b\u4e3d\u73cd/.test(x));
    }
    if (/\u9886\u5e26|\u8377\u53f6\u8fb9|\u8170\u95f4\u7cfb/.test(inner())) pickInner((x) => !/\u9886\u5e26|\u8377\u53f6\u8fb9|\u8170\u95f4\u7cfb/.test(x));
    dropAcc((x) => /\u62a5\u7ae5\u5e3d|\u732b\u54aa|\u6761\u7eb9\u9488\u7ec7\u51b7\u5e3d|\u77ed\u624b\u5957/.test(x));
  }
  if (/\u76f4\u7b52\u8fd0\u52a8\u88e4/.test(bottom())) {
    if (/\u7ed1\u5e26|\u5fb7\u6bd4|\u739b\u4e3d\u73cd/.test(shoe())) {
      pickShoe((x) => /\u8fd0\u52a8\u978b|\u5fb7\u8bad|\u8001\u7239|\u677f\u978b|\u96ea\u5730\u9774|\u6bdb\u6bdb\u9774|\u77ed\u9774|\u4e50\u798f/.test(x) && !/\u7ed1\u5e26|\u5fb7\u6bd4|\u739b\u4e3d\u73cd/.test(x));
    }
    if (/\u9886\u5e26|\u8170\u95f4\u7cfb/.test(inner())) pickInner((x) => !/\u9886\u5e26|\u8170\u95f4\u7cfb/.test(x));
    dropAcc((x) => /\u62a5\u7ae5\u5e3d|\u732b\u54aa|\u77ed\u624b\u5957/.test(x));
  }
  if (/\u82b1\u82de/.test(bottom())) {
    if (/\u52c3\u80af|\u677f\u978b|\u8fd0\u52a8\u978b|\u5fb7\u8bad|\u8001\u7239|\u94c1\u9489/.test(shoe())) {
      pickShoe((x) => /\u7ed1\u5e26|\u4e50\u798f|\u77ed\u9774|\u5207\u5c14\u897f|\u9a6c\u4e01|\u739b\u4e3d\u73cd/.test(x) && !/\u52c3\u80af|\u8fd0\u52a8\u978b|\u5fb7\u8bad|\u8001\u7239|\u94c1\u9489|\u677f\u978b/.test(x));
    }
    if (/\u8377\u53f6\u8fb9|\u8170\u95f4\u7cfb|\u4eae\u84dd|\u6e56\u84dd|\u683c\u7eb9|\u6a2a\u6761/.test(inner())) {
      pickInner((x) => !/\u8377\u53f6\u8fb9|\u8170\u95f4\u7cfb|\u4eae\u84dd|\u6e56\u84dd|\u683c\u7eb9|\u6a2a\u6761/.test(x));
    }
    dropAcc((x) => /\u68d2\u7403\u5e3d|\u6761\u7eb9\u9488\u7ec7\u51b7\u5e3d|\u732b\u54aa|\u62bd\u7ef3\u53cc\u80a9\u5305|\u77ed\u624b\u5957/.test(x));
  }
  if (/\u6ce2\u70b9/.test(bottom())) {
    if (/\u52c3\u80af|\u7ed1\u5e26|\u5fb7\u6bd4|\u677f\u978b|\u8fd0\u52a8\u978b|\u5fb7\u8bad|\u8001\u7239|\u739b\u4e3d\u73cd/.test(shoe())) {
      pickShoe((x) => /\u6bdb\u6bdb|\u96ea\u5730\u9774|\u77ed\u9774/.test(x) && !/\u52c3\u80af|\u7ed1\u5e26|\u5fb7\u6bd4|\u677f\u978b/.test(x));
    }
    if (/\u8377\u53f6\u8fb9|\u8170\u95f4\u7cfb|\u9886\u5e26|\u683c\u7eb9|\u6a2a\u6761/.test(inner())) {
      pickInner((x) => !/\u8377\u53f6\u8fb9|\u8170\u95f4\u7cfb|\u9886\u5e26|\u683c\u7eb9|\u6a2a\u6761/.test(x));
    }
    dropAcc((x) => /\u62a5\u7ae5\u5e3d|\u62bd\u7ef3\u53cc\u80a9\u5305|\u77ed\u624b\u5957|\u6761\u7eb9\u9488\u7ec7\u51b7\u5e3d/.test(x));
  }
  if (/\u4e00\u4fa7\u819d\u76d6\u6709\u7834\u6d1e/.test(bottom())) {
    if (/\u52c3\u80af|\u7ed1\u5e26|\u94c1\u9489|\u739b\u4e3d\u73cd/.test(shoe())) {
      pickShoe((x) => /\u5fb7\u6bd4|\u677f\u978b|\u4e50\u798f|\u8fd0\u52a8\u978b|\u5fb7\u8bad/.test(x) && !/\u52c3\u80af|\u7ed1\u5e26|\u94c1\u9489|\u739b\u4e3d\u73cd/.test(x));
    }
    if (/\u8377\u53f6\u8fb9|\u8170\u95f4\u7cfb|\u6e56\u84dd|\u683c\u7eb9|\u6a2a\u6761/.test(inner())) {
      pickInner((x) => !/\u8377\u53f6\u8fb9|\u8170\u95f4\u7cfb|\u6e56\u84dd|\u683c\u7eb9|\u6a2a\u6761/.test(x));
    }
    dropAcc((x) => /\u62a5\u7ae5\u5e3d|\u732b\u54aa/.test(x));
  }
  if (/\u7c73\u767d\u8272\u9ad8\u8170\u9614\u817f\u88e4/.test(bottom())) {
    if (/\u7ed1\u5e26|\u52c3\u80af|\u739b\u4e3d\u73cd|\u94c1\u9489/.test(shoe())) {
      pickShoe((x) => /\u677f\u978b|\u8fd0\u52a8\u978b|\u5fb7\u8bad|\u8001\u7239|\u5fb7\u6bd4|\u4e50\u798f/.test(x) && !/\u7ed1\u5e26|\u52c3\u80af|\u739b\u4e3d\u73cd|\u94c1\u9489/.test(x));
    }
    if (/\u8377\u53f6\u8fb9|\u9886\u5e26/.test(inner())) pickInner((x) => !/\u8377\u53f6\u8fb9|\u9886\u5e26/.test(x));
    dropAcc((x) => /\u62a5\u7ae5\u5e3d|\u732b\u54aa/.test(x));
  }
  if (/\u7ea2\u767d\u7ec6\u683c\u7eb9\u8377\u53f6\u8fb9|\u8377\u53f6\u8fb9\u5c42\u5c42\u4e0b\u6446/.test(inner())) {
    if (/\u8fd0\u52a8\u77ed\u88e4|\u6ce2\u70b9|\u4e00\u4fa7\u819d\u76d6\u6709\u7834\u6d1e/.test(bottom())) {
      pickBottom((b) => /\u76f4\u7b52\u8fd0\u52a8\u88e4|\u536b\u88e4|\u4e2d\u88d9|\u4e2d\u957f\u88d9|\u957f\u88d9/.test(b) && !/\u8fd0\u52a8\u77ed\u88e4|\u6ce2\u70b9|\u4e00\u4fa7\u819d\u76d6\u6709\u7834\u6d1e/.test(b));
    }
  }
  if (/\u8170\u95f4\u7cfb\u84dd\u767d\u7ec6\u683c\u5b50\u886c\u886b/.test(inner())) {
    if (/\u82b1\u82de|\u6ce2\u70b9|\u8fd0\u52a8\u77ed\u88e4/.test(bottom())) {
      pickBottom((b) => /\u9614\u817f|\u725b\u4ed4|\u536b\u88e4/.test(b) && !/\u82b1\u82de|\u6ce2\u70b9|\u8fd0\u52a8\u77ed\u88e4/.test(b));
    }
    dropAcc((x) => /\u62a5\u7ae5\u5e3d|\u732b\u54aa/.test(x));
  }
  if (out.acc.some((x) => /\u732b\u54aa/.test(x)) && !/\u6ce2\u70b9|\u767e\u8936\u77ed\u88d9/.test(bottom())) {
    dropAcc((x) => /\u732b\u54aa/.test(x));
  }
  if (out.acc.some((x) => /\u62a5\u7ae5\u5e3d/.test(x)) && /\u8fd0\u52a8\u77ed\u88e4|\u76f4\u7b52\u8fd0\u52a8\u88e4|\u4e00\u4fa7\u819d\u76d6\u6709\u7834\u6d1e|\u9614\u817f\u88e4|\u725b\u4ed4\u88e4/.test(bottom())) {
    dropAcc((x) => /\u62a5\u7ae5\u5e3d/.test(x));
  }
}

/** 外套×下装明度对比：米白外套禁同明度奶油裙/燕麦卫裤；黑外套少纯黑下装 */
function fixJacketBottomContrast(pools: Pools, out: Vals, locks: Locks, jacket: number, history: Snap[]): void {
  if (locks.bottom) return;
  const J = JACKETS[jacket] || JACKETS[0];
  const bottom = out.bottom[0] || "";
  const pose0 = out.pose[0] || "";
  const scene0 = out.scene[0] || "";
  const recentOf = (k: SlotKey) => history.map((h) => (h.vals[k] || [])[0] || "");
  const pickContrast = (c: string[]) => {
    if (c.length === 0) return;
    out.bottom = [pickOne(c, recentOf("bottom"), 5)];
  };
  if (/米白/.test(J.name) || /米白/.test(J.word)) {
    const tooLight = /奶白|奶白色|米白/.test(bottom) || bottom.indexOf("燕麦色廓形阔腿卫裤") >= 0;
    if (tooLight) {
      const ok = pools.bottom.filter(
        (b) =>
          !/奶白|奶白色|米白/.test(b) &&
          b.indexOf("燕麦色廓形阔腿卫裤") < 0 &&
          poseOk(pose0, b, scene0)
      );
      const prefer = ok.filter((b) => /黑|深蓝|靛蓝|牛仔|做旧|破洞|橄榄|卡其|咖啡|深棕|木匠|喇叭|工装|百褶/.test(b));
      pickContrast(prefer.length > 0 ? prefer : ok);
    }
  } else if (J.name === "黑色" || J.word === "黑色") {
    if (/^黑色/.test(bottom) && Math.random() < 0.7) {
      const ok = pools.bottom.filter((b) => !/^黑色/.test(b) && poseOk(pose0, b, scene0));
      const prefer = ok.filter((b) => /牛仔|橄榄|卡其|咖啡|深蓝|靛蓝|做旧|破洞|木匠|喇叭|工装|驼|棕|灰|酒红/.test(b));
      pickContrast(prefer.length > 0 ? prefer : ok);
    }
  }
}

function fixHead(pool: string[], acc: string[]): string[] {
  const heads = acc.filter((x) => HEAD_RE.test(x));
  if (Math.random() < 0.5) {
    if (heads.length > 0) return acc;
    const c = pool.filter((x) => HEAD_RE.test(x));
    if (c.length === 0) return acc;
    return [c[rnd(c.length)]].concat(acc.slice(0, 1));
  }
  const rest = acc.filter((x) => !HEAD_RE.test(x));
  if (rest.length > 0) return rest;
  const c2 = pool.filter((x) => !HEAD_RE.test(x));
  return c2.length > 0 ? [c2[rnd(c2.length)]] : acc;
}

function fixAcc(acc: string[]): string[] {
  let a = acc.slice();
  const has = (w: string) => a.some((x) => x.indexOf(w) >= 0);
  const drop = (w: string) => {
    a = a.filter((x) => x.indexOf(w) < 0);
  };
  const heads = a.filter((x) => HEAD_RE.test(x));
  if (heads.length > 0) {
    a = a.filter((x) => !HEAD_RE.test(x) || x === heads[0]);
    drop("发夹");
  }
  const bags = a.filter((x) => x.indexOf("包") >= 0);
  if (bags.length > 1) a = a.filter((x) => x.indexOf("包") < 0 || x === bags[0]);
  if (has("墨镜")) drop("眼镜");
  const necks = a.filter((x) => /围巾|围脖/.test(x));
  if (necks.length > 1) a = a.filter((x) => !/围巾|围脖/.test(x) || x === necks[0]);
  if (has("围巾") || has("围脖")) drop("项链");
  if (has("耳机")) drop("耳钉");
  return a.length > 0 ? a : ["一副细框眼镜"];
}

function isSeated(v: Vals): boolean {
  const k = parsePose(v.pose[0] || "").kind;
  return k === "坐" || k === "蹲";
}

function drawTpl(history: Snap[], seated: boolean): number {
  const pool = seated ? ["4", "5"] : ["0", "1", "2", "3"];
  const v = pickOne(pool, history.map((h) => String(h.tpl)), seated ? 1 : 2);
  return Number(v);
}

type PoseInfo = { t: string; v: string; kind: string; needs: string[]; open: boolean };

const SEAT_KEY: Record<string, RegExp> = {
  台阶: /台阶|踏步|石阶/,
  长凳: /凳|长椅/,
  矮墙: /矮墙/,
  楼梯: /楼梯/,
  栏杆: /护栏|栏杆|扶手/,
  墙面: /墙/,
  便利店: /便利店/,
  堤道: /堤道/,
  床: /床单|床铺/,
};
const SEAT_NOUN: Record<string, string> = {
  台阶: "台阶上",
  长凳: "长凳上",
  矮墙: "低矮的石墙边沿",
  楼梯: "楼梯上",
  栏杆: "栏杆上",
  墙面: "墙面上",
  便利店: "便利店门口的台阶上",
  堤道: "海边堤道的步道上",
  床: "床上",
  方凳: "简约的原木色方凳上",
};
const SEAT_ADD: Record<string, string> = {
  台阶: "身旁有一段浅灰水泥台阶",
  长凳: "身旁有一条原木色长凳",
  矮墙: "身旁有一段低矮的浅灰石砌矮墙，墙面与墙顶无绿植",
  楼梯: "身旁有一段浅灰水泥楼梯",
  方凳: "画面中有一只简约的原木色方凳",
};
const STRICT_SEATS = ["便利店", "堤道", "栏杆", "床"];
const SHORT_SKIRT = /裙|短裤/;
const MINI_SKIRT = /短裙|小短裙|迷你裙|迷你百褶|裙长到大腿|裤长到大腿|膝上一掌|膝盖上方/;
const PANTS_RE = /牛仔裤|阔腿|工装|卫裤|短裤|运动裤|阿伯|破洞/;
const HEAD_RE = /帽|头巾|发箍|发带|耳罩|头戴式耳机|墨镜/;
const HOLD_RE = /手机|咖啡|冰淇淋|饮料|热饮|双手抬起/;
const ARM_BUSY = /双手|双肘|手机|咖啡|冰淇淋|热饮|托着|轻托|扶着|撑/;
const ARM_BAG = /托特|腋下包|手提|拎/;

function armConflict(pose: string, acc: string[]): boolean {
  return ARM_BUSY.test(parsePose(pose).t) && acc.some((x) => ARM_BAG.test(x));
}

function sameLight(v: Vals): string {
  const l = v.light[0] || "";
  if (/夜间相机直闪/.test(l)) return "夜景暗部允许有自然噪点；";
  return "人物与环境同一光照不补光" + (/蓝调/.test(l) ? "，允许人物偏暗、有自然噪点" : "") + "；";
}

function texNote(v: Vals): string {
  return "羽绒服有穿着后的自然褶皱，" + (/墙/.test(v.scene[0] || "") ? "地面和墙面" : "地面") + "纹理自然不过锐";
}

function whiteNote(v: Vals, jacket: number): string {
  const wj = (JACKETS[jacket] || JACKETS[0]).word.indexOf("米白") >= 0;
  const ws = WHITE_SCENE_RE.test(v.scene[0] || "");
  if (!wj && !ws) return "";
  return ws && /墙/.test(v.scene[0] || "") ? "白色衣物与墙面保留绗缝和墙面纹理" : "白色衣物保留绗缝纹理";
}

const ACCENTS = ["红色", "薰衣草紫色", "灰色", "米白色"];
const ACCENTS_BLACK = ["红色", "红色", "灰色", "米白色"];

function hashStr(s: string): number {
  let h = 7;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 1000003;
  return h;
}

function parsePose(s0: string): PoseInfo {
  let s = s0.trim();
  let kind = "站";
  let needs: string[] = [];
  let open = false;
  const m = s.match(/^【([^】]*)】/);
  if (m) {
    const parts = m[1].split("/");
    kind = parts[0] || "站";
    needs = (parts[1] || "").split("、").filter((x) => x.length > 0 && !!SEAT_KEY[x]);
    open = parts[2] === "开";
    s = s.slice(m[0].length);
  }
  const i = s.indexOf("｜");
  if (i < 0) return { t: s.trim(), v: DEFAULT_VIDEO_HINT, kind: kind, needs: needs, open: open };
  const v = s.slice(i + 1).trim();
  return { t: s.slice(0, i).trim(), v: v || DEFAULT_VIDEO_HINT, kind: kind, needs: needs, open: open };
}

function seatFor(info: PoseInfo, scene: string): { noun: string; add: string } {
  if (info.needs.length === 0) return { noun: "", add: "" };
  for (const n of info.needs) {
    if (SEAT_KEY[n].test(scene)) return { noun: n === "长凳" && scene.indexOf("长椅") >= 0 ? "木质长椅上" : SEAT_NOUN[n] || "", add: n === "便利店" ? "门口有两级浅灰石材台阶" : "" };
  }
  const free = info.needs.filter((n) => STRICT_SEATS.indexOf(n) < 0)[0];
  if (free && scene.indexOf("无缝") >= 0) return { noun: SEAT_NOUN["方凳"], add: SEAT_ADD["方凳"] };
  const n1 = free || info.needs[0];
  return { noun: SEAT_NOUN[n1] || "", add: SEAT_ADD[n1] || "" };
}

function fillSeat(s: string, seat: { noun: string; add: string }): string {
  return s.split("{座}").join(seat.noun || "座位上");
}

function poseText(raw: string, scene: string): string {
  const info = parsePose(raw);
  return fillSeat(info.t, seatFor(info, scene));
}

const SCENE_HAND_RE = /购物篮|对着镜面自拍/;
function poseOk(p: string, bottom: string, scene: string): boolean {
  const info = parsePose(p);
  if (info.open && SHORT_SKIRT.test(bottom)) return false;
  if ((info.kind === "坐" || info.kind === "蹲") && MINI_SKIRT.test(bottom)) return false;
  if (SCENE_HAND_RE.test(scene)) {
    if (HOLD_RE.test(p) || /自拍/.test(p)) return false;
    if (/电梯/.test(scene) && info.kind !== "站") return false;
  }
  if (info.needs.length === 0) return true;
  if (info.needs.some((n) => SEAT_KEY[n].test(scene))) return true;
  return scene.indexOf("无缝") >= 0 && info.needs.some((n) => STRICT_SEATS.indexOf(n) < 0);
}

function colorWord(c: string): string {
  const t = c.trim();
  if (!t) return "";
  return t.slice(-1) === "色" ? t : t + "色";
}

function mutedSockColor(palette: string, jacketWord: string): string {
  const parts = (palette || "").split("与").map((c) => c.trim()).filter((c) => c.length > 0 && !/白|黑/.test(c));
  if (parts.length > 0) return colorWord(parts[0]);
  if (jacketWord && !/白|黑/.test(jacketWord)) return colorWord(jacketWord);
  return "浅灰色";
}

function rewriteWhiteSock(shoe: string, muted: string): string {
  return shoe.replace(/配(米白色|纯白色|奶油白色|奶白色|象牙白色|白色)(针织)?(中筒袜|堆堆袜|厚袜)/g, (_m, _c, knit, kind) => "配" + muted + (knit || "") + kind + "，不要纯白抢眼");
}

function buildImage(v: Vals, jacket: number, faceRef: boolean): string {
  const J = JACKETS[jacket] || JACKETS[0];
  const pose = parsePose(v.pose[0] || "");
  const bottom = (v.bottom[0] || "").replace(/，?(开叉处)?配[^，；]*?(丝袜|打底袜|过膝袜)/g, "");
  const seat = seatFor(pose, v.scene[0] || "");
  const nonStand = pose.kind !== "站" || HOLD_RE.test(pose.t);
  const poseT = fillSeat(pose.t, seat) + (pose.open && SHORT_SKIRT.test(bottom) ? "，双腿并拢，动作收敛" : "");
  const seatDup = seat.noun !== "" && poseT.indexOf(seat.noun) >= 0;
  const stance = pose.kind === "站" ? "" : seatDup ? (pose.kind === "蹲" ? "" : "脚下是平整的地面") : pose.kind === "坐" ? "人物坐在" + (seat.noun || "座位上") + "，脚下是平整的地面" : pose.kind === "蹲" ? "人物蹲在" + (seat.noun || "平整的地面上") : pose.kind === "靠" ? "人物倚靠在" + (seat.noun || "墙面上") + "，脚下是平整的地面" : "人物站在平整的地面上";
  const seatAdd = seat.add ? seat.add + "。" : "";
  const skirt = SHORT_SKIRT.test(bottom);
  const dress = bottom.indexOf("连衣裙") >= 0;
  const shoeRaw = v.shoe[0] || "";
  const shoe0 =
    !skirt && /过膝|腿套/.test(shoeRaw)
      ? "圆头粗跟短靴"
      : PANTS_RE.test(bottom) && /玛丽珍/.test(shoeRaw)
        ? "圆头厚底乐福鞋"
        : skirt && /(运动鞋|德训)/.test(shoeRaw) && /腿套/.test(shoeRaw)
          ? /毛呢/.test(bottom) || !/百褶/.test(bottom)
            ? "圆头厚底乐福鞋"
            : "圆头玛丽珍鞋配针织腿套，堆在脚踝到小腿"
          : shoeRaw;
  const lowShoe = skirt && /乐福|玛丽珍|运动鞋|德训/.test(shoe0);
  const sneaker = /运动鞋|德训/.test(shoe0);
  const neutral = sneaker ? "运动鞋白银色" : "";
  const hs = hashStr((v.bottom[0] || "") + (v.shoe[0] || "") + (v.scene[0] || "") + (v.inner[0] || ""));
  const accRed = v.acc.filter((x) => x.indexOf("红色") >= 0)[0] || "";
  const innerRed = (v.inner[0] || "").indexOf("红色") >= 0 && !dress;
  const redWhat = innerRed ? "红色针织内搭" : accRed ? (accRed.indexOf("围巾") >= 0 ? "红色围巾" : "红色小包") : "";
  const accList0 = J.name === "黑色" ? ACCENTS_BLACK : ACCENTS;
  const accent = redWhat ? "" : hs % 5 < 3 ? accList0[Math.floor(hs / 5) % accList0.length] : "";
  const colorItems = ["下装"].concat(innerRed ? [] : ["内搭"]).concat(["鞋靴"]).concat(accRed && !innerRed ? [] : ["配饰"]);
  const colorSubj = colorItems.slice(0, -1).join("、") + "与" + colorItems[colorItems.length - 1];
  const tieNow = (v.inner[0] || "").indexOf("领带") >= 0;
  const sockNoun = tieNow || Math.floor(hs / 7) % 2 === 0 ? "及膝高筒袜" : "堆堆袜";
  const muted = mutedSockColor(v.palette[0] || "", J.word);
  const hasSock = shoe0.indexOf("袜") >= 0;
  const legwarm = skirt && shoe0.indexOf("腿套") >= 0;
  const blackShoe = shoe0.indexOf("黑") >= 0;
  const sockOnAccent = !hasSock && lowShoe && !legwarm && accent !== "" && !blackShoe;
  let shoeCore = rewriteWhiteSock(shoe0, muted);
  if (shoe0.indexOf("黑") >= 0 && shoe0.indexOf("白") >= 0) shoeCore += "，鞋底浅色不要过于跳，不要再配纯白袜，避免黑白强对比";
  const sockT = hasSock ? "" : legwarm ? "，腿套为" + muted + "，腿套内不要再露出白袜" : lowShoe ? "，搭配" + muted + sockNoun + "，只穿一层袜子，不要再叠白袜，袜子低对比不要纯白抢眼" : "";
  const hatAcc = !sockOnAccent && accent !== "" && v.acc.some((x) => /帽|头巾/.test(x)) ? "；帽子上带一处" + accent + "的小面积撞色点缀" : "";
  const shoe = shoeCore + sockT;
  const accList = skirt ? v.acc : v.acc.filter((x) => x.indexOf("腿环") < 0);
  const accText = (accList.length > 0 ? accList : ["一副细框眼镜"]).join("；") + hatAcc;
  const legT = "";
  const outfit = dress ? "连衣裙为" + bottom + (legT ? "，" + legT : "") + "，不另加内搭" : "下装为" + bottom + (legT ? "，" + legT : "") + "；内搭：" + v.inner[0];
  const body = skirt ? "腰腹覆盖，" + (bottom.indexOf("裙") >= 0 ? "裙摆" : "短裤") + "露出羽绒服下摆" : "腰腹覆盖，裤脚不堆积";
  const faceText = faceRef ? "韩国女大学生，保留参考图五官，真实皮肤与自然神态，不要美颜感，" : "韩国女大学生，" + (v.face[0] || "") + "，";
  const lines: string[] = [];
  if (faceRef) lines.push("脸参考图3");
  lines.push("9:16竖版，单人完整全身街拍，构图宽松不要顶天立地，头顶上方留出约画面高度20%的空白，头发、发饰和马尾完整入镜且不贴上沿，双脚与鞋履完整入镜，脚下略留地面，相机" + v.camera[0] + "，" + "21岁" + faceText + "大长腿，头小颈长，头身比正常、头部偏小不夸张，禁止头大身小或大头娃娃比例，身材比例正常，头、肩、躯干和腿的长度协调，腿长占身长比例高，从胯到脚踝明显长于上身，不要腿短身长或小腿偏短；戴帽时头与帽子的整体体积不要过大，不要头重身轻，肩宽与头宽比例自然，腿部修长，四肢关节自然不变形，保留皮肤纹理，" + (v.makeup[0] || "韩系淡妆") + "。姿态松弛，" + poseT + "。没拿东西的那只手手指微曲、手腕放松，不要僵直垂在身侧。");
  lines.push("羽绒服严格参考原图：" + jacketPrompt(J));
  const contrastNote =
    /米白/.test(J.word) && /黑|深灰|藏青|深棕|咖啡/.test(v.palette[0] || "")
      ? "，下装取配色中的深色，与米白外套拉开明度"
      : "";
  lines.push("穿搭：韩系甜酷小性感，修身高腰显腿长。配色：" + J.word + "为主，搭配" + v.palette[0] + "，其余单品只用这两种色" + contrastNote + (neutral ? "，" + neutral + "不计入" : "") + (redWhat ? "；" + redWhat + "是全身唯一的小面积撞色点缀" : "") + "。" + outfit + "；脚穿" + shoe + "；配饰：" + accText + "。" + body + "。领口不低于锁骨下方，不露乳沟" + (skirt && pose.kind === "坐" ? (bottom.indexOf("裙") >= 0 ? "，坐姿裙摆盖住大腿，不走光" : "，坐姿双腿并拢或交叠，不走光") : "") + "。鞋袜只穿一层，不要堆堆袜再配白袜；袜子低对比，不要纯白厚袜抢眼；黑鞋不要配白袜或过于跳的白厚底，避免黑白强对比发土。腿长占身长比例高，厚底鞋或长裙阔腿时仍要看出腿长。");
  lines.push("背景：" + v.scene[0] + "。" + seatAdd + (stance ? stance + "，" : "") + "无人群、无绿植、无可读文字。背景简洁虚化不抢主体，主体羽绒服清晰锐利，背景色偏中性低对比。");
  const light0 = lightText(v);
  if (CREAM_RE.test(light0)) {
    lines.push("光影与质感：" + light0 + "；" + baseWhite(v) + "；" + "羽绒服保持" + J.word + "原色，肤色不泛橙红；手机随手拍的真实照片，人物与环境同一光照不补光，背景浅景深虚化不抢主体，主体羽绒服清晰锐利，不要磨皮、CG、滤镜或HDR感。");
  } else if (CCD_RE.test(light0)) {
    lines.push("光影与质感：" + light0 + "。模糊与颗粒只作用在背景与动作处，人物主体与羽绒服标志仍清晰可辨；" + baseWhite(v) + "；肤色真实不泛橙红，不过度磨皮与锐化，不加HDR感，不要CG感或滤镜感。");
  } else {
    lines.push("光影与质感：" + light0 + "。手机随手拍的真实照片，色彩饱满但真实，曝光自然不发白，背景浅景深虚化不抢主体，主体羽绒服清晰锐利；" + sameLight(v) + (whiteNote(v, jacket) ? whiteNote(v, jacket) + "；" : "") + "不要磨皮、CG、滤镜或HDR感。");
  }
  return lines.join("\n");
}

type Shot = [string, string];
type Tpl = { name: string; seated?: boolean; shots: (t: string, v: string) => Shot[] };

const TEMPLATES: Tpl[] = [
  {
    name: "迎面走来回眸型",
    shots: (t, v) => [
      ["0到2秒", "全景，机位固定在齐胸高度。人物承接参考图的姿态，" + v + "，随后朝镜头方向走来，步伐轻快。"],
      ["2到4秒", "中景，镜头缓缓后退跟拍。人物边走边看向路边，被风吹乱的碎发在脸侧轻动，目光掠过镜头。"],
      ["4到5秒", "近景，手持轻微晃动。人物像听到画外朋友说了句话，看向镜头笑了一下，胸前门襟与左胸标志自然可见，发丝在暖光里轻轻浮动。"],
      ["5到7秒", "中景，侧面跟拍。人物从镜头旁走过，羽绒服衣襟随步伐摆动，视线随后转向画面外。"],
      ["7到9秒", "全景，机位略低，从背后拍摄。人物走远，走到一半被朋友叫住，回头笑一下，衣角随风轻动。"],
    ],
  },
  {
    name: "走过场景侧跟型",
    shots: (t, v) => [
      ["0到2秒", "全景，侧面固定机位。人物承接参考图的姿态，" + v + "，随后从场景中走过，向画面一侧走去。"],
      ["2到4秒", "中景，镜头横移跟拍。人物边走边侧头看向身旁的环境，衣摆与发丝随步伐轻动。"],
      ["4到6秒", "近景，前侧方手持跟拍。人物被画外的朋友叫了一声，转头朝镜头这边看过来，笑了一下，门襟与左胸标志自然可见。"],
      ["6到9秒", "全景，镜头缓缓拉远。人物走向画面深处，步伐轻快，走到一半被朋友叫住，停步回头，自然地笑一下。"],
    ],
  },
  {
    name: "近景开场拉远型",
    shots: (t, v) => [
      ["0到2秒", "近景，胸部以上，手持轻微晃动。人物目光看向镜头，嘴角微扬，发丝被风吹动，神态承接参考图。"],
      ["2到4秒", "中景，镜头缓缓拉远，逐渐露出全身。人物回到参考图的姿态，" + t + "。"],
      ["4到6秒", "全景，机位固定且略低。人物迈步向前，衣摆与衣襟随风轻动。"],
      ["6到7秒", "近景，侧面。人物单手拉了一下袖口，再抬眼望向前方，暖色光落在发丝与衣缘上。"],
      ["7到9秒", "全景，手持跟拍。人物转身走向画面远处，走几步后回头看一眼镜头。"],
    ],
  },
  {
    name: "背影开场转身型",
    shots: (t, v) => [
      ["0到2秒", "全景，背面，机位略低。人物背对镜头迈步前行，衣摆随风轻动，走了几步后慢下脚步。"],
      ["2到4秒", "中景，镜头快速推近。人物转身面向镜头，回到参考图的姿态，" + t + "。"],
      ["4到5秒", "近景，手持轻微晃动。人物像刚听到画外朋友说话，看向镜头笑了一下，门襟与左胸标志自然可见。"],
      ["5到7秒", "中景，侧面跟拍。人物沿场景中的地面向前走，步子不快，衣襟随步伐轻动，偶尔看一眼路边。"],
      ["7到9秒", "全景，镜头缓缓后退。人物迎着镜头走来，最后停下脚步，被逗笑了，抬头朝镜头这边看。"],
    ],
  },
  {
    name: "坐姿小动作变景别型（坐姿用）",
    seated: true,
    shots: (t, v) => [
      ["0到2秒", "近景，胸部以上，手持轻微晃动。人物承接参考图的姿态，" + v + "，发丝被风轻轻吹动。"],
      ["2到4秒", "中景，机位固定在齐胸高度。人物保持坐姿，像在听画外朋友说话，微微调整坐姿或重心，姿态保持得体。"],
      ["4到6秒", "全景，机位略低，从斜前方拍摄，露出全身与身旁的座位。人物上身微微转向镜头，衣襟与发丝随风轻动。"],
      ["6到7秒", "近景，侧面。人物抬头看到镜头，笑了一下，暖色光落在发丝与衣缘上。"],
      ["7到9秒", "中景，镜头缓缓推近。人物手撑身侧起身，拍拍衣服，回头朝镜头笑一下，随后继续往前走。"],
    ],
  },
  {
    name: "坐姿俯拍侧拍切换型（坐姿用）",
    seated: true,
    shots: (t, v) => [
      ["0到2秒", "全景，机位略高，轻微俯拍，露出全身与身旁的座位。人物承接参考图的姿态，" + v + "。"],
      ["2到4秒", "近景，侧面手持。人物先望向身旁的街边，再抬头朝镜头这边看。"],
      ["4到6秒", "中景，机位降到齐胸高度，镜头缓缓推近。人物微微调整坐姿或重心，上身转向镜头，听到画外朋友说话，笑了一下，门襟与左胸标志自然可见。"],
      ["6到7秒", "近景，前侧方。人物看向镜头，眼神自然，发丝在暖光里轻轻浮动。"],
      ["7到9秒", "全景，镜头缓缓拉远。人物手撑身侧起身，拍拍衣服，走出几步后回头看一眼镜头。"],
    ],
  },
];

const MUSIC_OPTS: { value: string; label: string; text: string }[] = [
  { value: "lyrics", label: "有歌词配乐", text: "配乐：韩系女团流行舞曲，有歌词，K-pop、Dance Pop融合轻盈的Future Bass。鼓点利落有弹性，深沉贝斯搭配鲜明的合成器、俏皮电子音色和切分节奏，营造自信、元气、甜酷的氛围。" },
  { value: "inst", label: "纯音乐配乐", text: "配乐：韩系女团流行舞曲风格的纯音乐，无人声、无歌词，K-pop、Dance Pop融合轻盈的Future Bass。鼓点利落有弹性，深沉贝斯搭配鲜明的合成器、俏皮电子音色和切分节奏，营造自信、元气、甜酷的氛围。" },
  { value: "kr-fresh", label: "韩系清新女声", text: "配乐：韩系清新女声流行，柔和女声与清澈吉他或轻钢琴，节奏轻盈，氛围干净温柔，像首尔午后街拍。" },
  { value: "kr-elec", label: "韩系轻快电子流行", text: "配乐：韩系轻快电子流行，明亮合成器与轻快鼓点，K-pop电子流行感，元气活泼，适合走动街拍。" },
  { value: "west-indie", label: "欧美独立流行女声", text: "配乐：欧美独立流行女声，清亮女声与简约乐器，Indie Pop气质，随性又有记忆点。" },
  { value: "west-rnb", label: "欧美慵懒 R&B", text: "配乐：欧美慵懒R&B，柔软贝斯与轻柔女声，节奏放缓，氛围松弛性感。" },
  { value: "indie-git", label: "轻快 indie 吉他", text: "配乐：轻快indie吉他纯音乐，无人声，清脆木吉他与轻鼓点，街头漫步感。" },
  { value: "lofi", label: "城市漫步 Lo-fi", text: "配乐：城市漫步Lo-fi，轻柔鼓点与柔和和弦，带一点磁带质感，无人声，适合街拍氛围。" },
  { value: "none", label: "不附配乐", text: "" },
];
function musicText(key: string): string {
  const o = MUSIC_OPTS.find((x) => x.value === key);
  return o && o.text ? o.text : "";
}

const ELEV_SHOTS: Shot[] = [
  ["0到2秒", "全景，侧面固定机位。人物承接参考图的姿态，保持回头看镜头，轻轻一笑，重心微换，身体仍站原位不迈步。"],
  ["2到4秒", "中景，镜头轻微横移。人物侧头看按键或门缝，发丝衣缘轻晃，双脚基本不动，只转头和肩线微调。"],
  ["4到6秒", "近景，前侧方手持。画外叫一声，人物转头看镜头笑一下，门襟与左胸标志可见，仍站原位。"],
  ["6到9秒", "全景，镜头缓缓拉远。人物抬手轻按电梯按钮或整理帽檐发丝，随后停住回头笑一下，始终不走动、不离开轿厢。"],
];
const ELEV_MOVE = "开场立即有动作，但整段都在电梯轿厢内站定完成，不迈步走动、不走出轿厢。";

function buildVideo(v: Vals, tpl: number, music: string, jacket: number = 0): string {
  const pose = parsePose(v.pose[0] || "");
  const T = TEMPLATES[tpl] || TEMPLATES[0];
  const elev = /电梯/.test(v.scene[0] || "");
  const warm = /暖|夕阳/.test(v.light[0] || "");
  const flash = /夜间相机直闪/.test(v.light[0] || "");
  const creamV = CREAM_RE.test(v.light[0] || "");
  const ccdV = CCD_RE.test(v.light[0] || "");
  const lightSent = creamV
    ? "环境光沿用参考图的雾白奶油色调，柔和散射日光落在脸颊与发丝，偏奶油、米白、浅粉的低饱和柔雾感，阴影很浅，肤色白皙自然，轻微柔焦。" + baseWhite(v) + "，羽绒服保持" + (JACKETS[jacket] || JACKETS[0]).word + "原色。"
    : ccdV
      ? "环境光沿用参考图的低保真卡片机质感，闪光灯直打人物，画面带轻微模糊、颗粒与偏色，动作处可带轻微运动拖影。" + baseWhite(v) + "。"
      : "";
  const wide = WIDE_RE.test(v.camera[0] || "");
  const seat = seatFor(pose, v.scene[0] || "");
  const shots = elev ? ELEV_SHOTS : T.shots(fillSeat(pose.t, seat), fillSeat(pose.v, seat));
  const move = elev ? ELEV_MOVE : T.seated ? "开场立即有动作，不要全程静止，结尾可以起身。" : "开场立即有动作，可以走动。";
  const lines = shots.map((s, i) => "镜头" + (i + 1) + "（" + s[0] + "）：" + (warm ? s[1] : s[1].replace(/暖色光/g, "光线").replace(/暖光/g, "光线")));
  const elevAmb = elev ? "环境声为轻微电梯运转与轿厢环境声。" : "";
  const parts = [
    "以参考图为基础，人物、服装与场景保持不变，生成9秒、720p、9:16竖屏的韩系街拍短视频。人物像被朋友随手拍到，自信松弛，带一点小性感，动作连贯自然。" + move + "共" + shots.length + "个镜头，硬切，景别与机位如下：",
    lines.join("\n"),
    "镜头带轻微手持感，随性的生活抓拍。" + "景深沿用手机主摄的自然效果，背景基本清晰，不要大光圈奶油虚化。" + (lightSent !== "" ? lightSent : (flash ? "沿用参考图的夜间相机直闪，闪光照亮人物，背景保持深色有层次，" : /汉江/.test(v.scene[0] || "") && /蓝调/.test(v.light[0] || "") ? "环境光沿用参考图的蓝调光线，对岸城市灯火与江边路灯的暖色光" : "环境光沿用参考图的光源方向与色调，" + (warm ? "暖色光线" : "光线")) + (flash ? "光线" : "") + "自然落在脸颊、发丝和衣服边缘，色彩饱满但真实，曝光自然不发白" + (flash ? "" : "，人物与环境光一致不补光" + (/蓝调/.test(v.light[0] || "") ? "，允许人物偏暗、有自然噪点" : "")) + (whiteNote(v, jacket) ? "，" + whiteNote(v, jacket) : "") + "，不要影棚布光感或滤镜感。") + elevAmb + "肤色与服装颜色真实，双手动作都自然不僵硬，手指关节弯曲自然；持物的那只手指尖分开贴合物体、手掌有承托感，不要整只手贴死在杯壁上；没拿东西的那只手不要僵直垂在身侧或整臂撑死在座位上，手指微曲、手腕放松，可自然搭在膝上、身侧或座位边，不要假人式僵直，服装结构稳定。" + LOGO_ORIENT + "。无对白、无旁白、无字幕、无水印。模特全程不说话、不哼唱、不发出笑声与呼吸呢喃等人声。",
  ];
  const mus = musicText(music);
  if (mus) parts.push(mus);
  return parts.join("\n");
}

type ImgModel = "gpt" | "nano";
type VidModel = "seedance" | "kling";
const IMG_MODELS: { value: ImgModel; label: string }[] = [{ value: "gpt", label: "GPT Image 2" }, { value: "nano", label: "Nano Banana" }];
const VID_MODELS: { value: VidModel; label: string }[] = [{ value: "seedance", label: "Seedance 2.0 Fast" }, { value: "kling", label: "可灵 4.0" }];
const IMG_HEAD = "9:16竖版，单人完整全身街拍，构图宽松不要顶天立地，头顶上方留出约画面高度20%的空白，头发、发饰和马尾完整入镜且不贴上沿，双脚与鞋履完整入镜，脚下略留地面，";

function swapAll(s: string, pairs: [string, string][]): string {
  let out = s;
  for (const p of pairs) out = out.split(p[0]).join(p[1]);
  return out;
}

function imageFor(m: ImgModel, v: Vals, jacket: number, faceRef: boolean): string {
  const ls = buildImage(v, jacket, faceRef).split("\n");
  if (faceRef) ls.shift();
  const person = ls[0].replace(IMG_HEAD, "").replace("保留参考图五官，真实皮肤与自然神态，不要美颜感，", "保留图3五官，");
  const J = JACKETS[jacket] || JACKETS[0];
  const VIS = jacketVis(J);
  const NECK = "领口不低于锁骨下方，不露乳沟";
  const mirrorExtra = /镜面|电梯/.test(v.scene[0] || "") ? LOGO_MIRROR_EXTRA + "。" : "";
  const jk0 = ls[1].replace(jacketShort(J) + "，颜色为" + J.word + "，", J.word + jacketShort(J) + "，");
  const jk = jk0.replace("还原版型、衣长与蓬松度，" + VIS, "");
  const ot = ls[2];
  const bg = ls[3], lt = ls[4];
  if (m === "nano") {
    const cam = "相机" + v.camera[0] + "，";
    const soft: [string, string][] = [
      ["，不要美颜感", "，素颜般真实"],
      ["不过度磨皮与锐化，不加HDR感，不要CG感或滤镜感", "皮肤与细节保持未修图的原片质感"],
      ["不要磨皮、CG、滤镜或HDR感", "皮肤有真实毛孔，像未修图原片"],
      ["背景浅景深虚化不抢主体，主体羽绒服清晰锐利", "背景浅景深虚化，主体羽绒服清晰"],
      ["人物与环境同一光照不补光", "人物与环境处在同一光照下"],
      ["肤色真实不泛橙红", "肤色真实自然"],
      ["肤色不泛橙红", "肤色真实自然"],
    ];
    return swapAll(
      "生成一张9:16竖版的照片级写实韩系街拍照片。" +
      "主角是" + person.replace(cam, "") +
      jk0.replace("羽绒服严格参考原图：", "她穿着图1正面、图2背面里的") +
      ot.replace("穿搭：", "穿搭是") +
      bg.replace("背景：", "她身处").replace("无人群、无绿植、无可读文字。背景简洁虚化不抢主体，主体羽绒服清晰锐利，背景色偏中性低对比。", "周围只有她一人，没有绿植与可读文字。背景简洁虚化不抢主体，主体羽绒服清晰锐利，背景色偏中性低对比。") +
      "全身构图宽松，不要顶天立地，头顶上方留出约画面高度20%的空白，头发、发饰和马尾完整入镜且不贴上沿，双脚完整入镜，脚下略留地面，相机" + v.camera[0] + "。" +
      lt.replace("光影与质感：", "光影上，") +
      mirrorExtra,
      soft
    );
  }
  return [
    "用途：9:16竖版韩系街拍" + (lt.indexOf("真实照片") >= 0 ? "" : "，照片级写实") + "，单人全身，构图宽松不要顶天立地，头顶上方留出约画面高度20%的空白，头发、发饰和马尾完整入镜且不贴上沿，双脚完整入镜，脚下略留地面。",
    bg,
    "人物：" + person.replace("姿态松弛，", ""),
    jk.replace("羽绒服严格参考原图：", "羽绒服：按图1正面、图2背面严格还原版型、衣长与蓬松度，"),
    ot.replace("。" + NECK, ""),
    lt,
    "约束：羽绒服" + VIS.replace("不添加", "不加").replace("。", "；") + NECK + "。" + mirrorExtra,
  ].join("\n");
}

function videoFor(m: VidModel, v: Vals, tpl: number, music: string, jacket: number): string {
  const ls = buildVideo(v, tpl, "none", jacket).split("\n");
  const T = TEMPLATES[tpl] || TEMPLATES[0];
  const elev = /电梯/.test(v.scene[0] || "");
  const n = ls.length - 2;
  const word = (JACKETS[jacket] || JACKETS[0]).word;
  const move = elev ? ELEV_MOVE : T.seated ? "开场立即有动作，不要全程静止，结尾可以起身。" : "开场立即有动作，可以走动。";
  const amb = elev ? "轻微电梯运转与轿厢环境声" : "轻微街头环境声";
  const shotsRaw = ls.slice(1, 1 + n).map((s) => s.replace(/^镜头\d（[^）]*）：/, "").split("人物").join("女孩").split("参考图").join("@图片1"));
  const codes = ls.slice(1, 1 + n).map((s) => (s.match(/^镜头\d（([^）]*)）/) || ["", ""])[1]);
  const style = ls[ls.length - 1].replace("镜头带轻微手持感，随性的生活抓拍。", "").split("人物").join("女孩").split("参考图").join("@图片1").replace("无对白、无旁白、无字幕、无水印。模特全程不说话、不哼唱、不发出笑声与呼吸呢喃等人声。", "");
  const mus = musicText(music);
  if (m === "kling") {
    const pos = swapAll(style, [
      ["，不要大光圈奶油虚化", ""],
      ["，不要影棚布光感或滤镜感", "，像自然光下的真实抓拍"],
      ["女孩与环境光一致不补光", "女孩与环境光一致"],
      ["腿部拉长但不畸变，羽绒服版型不变形", "腿部自然拉长，羽绒服版型保持原样"],
      ["肤色真实不泛橙红", "肤色真实自然"],
    ]);
    return [
      "【素材分工】@图片1作为首帧，定义女孩的长相、发型、服装与场景，全程保持一致。",
      "【整体设定】9秒、720p、9:16竖屏韩系街拍短视频，多镜头硬切，画面带轻微手持感。女孩像被朋友随手拍到，自信松弛，带一点小性感，动作连贯自然。" + move.replace("不要全程静止", "全程保持动态") + pos + "面部和身体比例稳定，保持头小颈长、不头大身小；双手动作自然不僵硬，持物时手指分开贴合，空闲的那只手手指微曲、手腕放松，不要僵直下垂或整臂撑死。画面不要字幕。",
      "【事件顺序】",
    ].concat(shotsRaw.map((s, i) => codes[i] + "：" + s)).concat([
      "【声音】" + (mus ? mus.replace(/。$/, "") + "；仅配乐加" + amb + "。女孩全程不说话、不哼唱、不发出笑声与呼吸呢喃等人声，无对白无旁白，只有动作和无声笑容。" : "仅" + amb + "，不要背景音乐。女孩全程不说话、不哼唱、不发出笑声与呼吸呢喃等人声，无对白无旁白。"),
    ]).join("\n");
  }
  const sd = shotsRaw.map((s, i) => "镜头" + (i + 1) + "：" + swapAll(s, [["机位降到齐胸高度，镜头缓缓推近", "镜头缓缓推近"], ["镜头快速推近", "镜头平稳推近"]]));
  const sdAmb = elev ? "仅" + amb + "，无人声，不附配乐" : "仅轻环境音，无人声，不附配乐";
  const sdAmbMus = elev ? "；仅配乐加" + amb + "，画面人物不发出人声）" : "；仅配乐加轻环境音，画面人物不发出人声）";
  return [
    "将@图片1中穿" + word + "Champion羽绒服的韩国女生定义为女孩，女孩、服装与场景保持@图片1的样子，生成9秒、720p、9:16竖屏的韩系街拍短视频。女孩像被朋友随手拍到，自信松弛，带一点小性感，动作连贯自然。" + move + "共" + n + "个镜头，硬切，每个镜头只用一种运镜：",
  ].concat(sd).concat([
    "画面带轻微手持感，随性的生活抓拍。" + style + "全程无对白、无旁白，女孩不说话、不哼唱、不发出笑声与呼吸呢喃等人声；保持无字幕，不要生成水印或额外Logo；同一画面只有女孩一人，面部和身体比例稳定不变形，保持头小颈长、不头大身小；双手动作自然不僵硬，持物时手指分开贴合，空闲的那只手手指微曲、手腕放松，不要僵直下垂或整臂撑死。",
  ]).concat(mus ? ["（" + mus.replace(/。$/, "") + sdAmbMus] : ["（" + sdAmb + "）"]).join("\n");
}

const POOL_KEY = "kr-down-pools-v13";
const POOL_LEGACY = "kr-down-pools-v12";
const POOL_LEGACY2 = "kr-down-pools-v11";
const POOL_LEGACY3 = "kr-down-pools-v10";
const HIST_KEY = "kr-down-history-v8";
const PREF_KEY = "kr-down-prefs-v3";
const PREF_LEGACY = "kr-down-prefs-v2";
const PAGE_VER = "v28 · 2026-11-10"; // 出图：空闲手、腿长与身材、头帽体积、鞋袜一层且不抢眼
const V11_MERGE: Partial<Record<PoolKey, string[]>> = {
  face: ["小圆脸，双眼皮圆眼，深棕色双低马尾辫，耳边有细碎发丝"],
  bottom: [
    "深棕色宽松阔腿裤，裤脚拖到脚面",
    "蓝色做旧直筒牛仔裤，裤长到鞋面",
    "深蓝绛绒阔腿裤，裤脚拖到脚面",
    "橄榄绿阔腿工装气球裤，裤脚拖到脚面",
    "卡其阔腿工装裤，大口袋，裤长到鞋面",
    "深蓝高腰阔腿喇叭牛仔裤，侧缝有装饰线，裤长盖住鞋面",
    "浅蓝阔腿木匠牛仔裤，裤长到鞋面",
    "深靛蓝直筒牛仔裤，裤长到鞋面",
    "黑色过膝百褶中裙，裙长刚过膝盖",
    "咖啡灰阔腿裤，裤脚拖到脚面",
    "燕麦色廓形阔腿卫裤，裤脚拖到脚面",
  ],
  inner: [
    "米白修身高领打底衫，领口贴合颈部",
    "蓝白横条修身长袖，圆领，领口在锁骨上方",
    "黑白横条半高领，领口在颈部中段",
    "米色华夫格长袖，圆领，领口在锁骨上方",
    "浅粉修身长袖，圆领，领口在锁骨上方",
    "深灰修身长袖，圆领，领口在锁骨上方",
    "米白修身长袖，毛绒袖口自然外露，圆领，领口在锁骨上方",
  ],
  shoe: [
    "浅灰厚袜配棕色麂皮包头穆勒鞋",
    "白色老爹鞋",
    "驼色厚底雪地靴",
    "米色厚底雪地靴拖鞋款",
    "灰白老爹鞋",
    "银灰老爹鞋",
    "驼色厚底毛毛靴配针织腿套，堆在脚踝到小腿",
  ],
  pal0: ["橄榄绿与米白", "燕麦色与浅粉"],
  pal1: ["深蓝与奶白", "炭灰与牛仔蓝"],
  pal2: ["芥末黄与米白", "橄榄绿与米白"],
  pal3: ["燕麦色与浅粉", "炭灰与牛仔蓝"],
  acc: [
    "一条浅粉粗针织毛线围巾，松松围在颈前",
    "一条宝蓝色针织围巾，垂挂在颈前两侧",
    "一只红色双肩包，背带贴合肩部",
    "一只灰色双肩包，背带贴合肩部，包上挂着一个小毛绒挂件",
    "一只黑色单肩帆布包，挎在肩侧",
    "一副细框圆眼镜",
    "一顶深蓝色Polo棒球帽，帽檐微压，不遮挡眼睛",
    "一顶深棕NY棒球帽，帽檐微压，不遮挡眼睛",
    "一只粉底黑波点大托特，挎在肩侧，包上挂着一个小毛绒公仔",
    "一只豹纹托特，挎在肩侧，包上挂着一个小毛绒公仔",
    "一只棕蓝格托特，挎在肩侧",
    "一条芥末黄格纹围巾，松松搭在颈前",
    "一条红白横条围巾，垂挂在颈前两侧",
    "一条薄荷绿小围巾，松松围在颈前",
    "一条深棕豹纹大围巾，松松搭在颈前",
    "一条深蓝北欧花纹围巾，垂挂在颈前两侧",
    "一只红色小号腋下包，夹在一侧手臂下",
    "一只驼色小肩包，挎在肩侧",
  ],
  light: ["室内顶灯的暖白光，光线柔和均匀地从上方落在人物身上，地面有淡淡的反光，色温偏暖不发青"],
};
const V22_MERGE: Partial<Record<PoolKey, string[]>> = {
  pose: [
    "【坐/长凳、台阶】坐在{座}，身体微侧，一手拿着纸杯咖啡，头微偏看向一侧｜先看向一侧，再转头看向镜头，嘴角微扬",
    "【坐/长凳、台阶、矮墙】坐在{座}，身体侧对镜头，一手托腮，目光看向一侧｜保持托腮的姿态，眼神慢慢移向镜头，浅浅一笑",
    "【坐/台阶、楼梯】坐在{座}，一只手轻轻拉着衣领或帽檐靠近脸颊，看向镜头｜手仍轻扶着衣领，看向镜头，嘴角微扬",
    "【坐/长凳】坐在{座}，身体前倾，一只手托腮，看向镜头｜保持托腮的姿态，笑意浅浅",
    "【坐/无/开】坐在地面上，一条腿屈起，上身放松，看向镜头｜保持坐姿，看向镜头，嘴角微扬",
    "【坐/长凳、台阶、矮墙】坐在{座}，低头看手机，神情放松｜先低头看手机，再抬眼看向镜头，嘴角微扬",
    "一只手抬起抚头发，微笑看向镜头，另一只手自然垂放｜指尖把发丝拨到耳后，随后看向镜头，嘴角微扬",
    "走在路上，一手端着咖啡杯和托碟，身体微侧，目光看向斜前方｜继续向前走，随后侧头看向镜头，嘴角微扬",
  ],
  bottom: [
    "深蓝灰高腰阔腿牛仔裤，裤脚拖到脚面",
    "深蓝灰高腰阔腿裤，裤脚拖到脚面",
    "高腰黑色百褶短裙，裙长到大腿中部",
    "高腰灰棕色百褶短裙，裙长到大腿中部",
    "高腰深灰垂坠长半裙，裙长过膝近小腿中段",
    "米白色高腰直筒牛仔裤，裤长到鞋面",
    "高腰深色格纹百褶短裙，格纹只用两种配色，裙长到大腿中部",
    "黑色宽松阔腿卫裤，裤脚拖到脚面",
    "浅粉色宽松阔腿卫裤，裤脚拖到脚面",
    "浅灰色宽松阔腿卫裤，裤脚拖到脚面",
  ],
  inner: [
    "灰色短款圆领T恤，领口在锁骨上方",
    "灰色圆领针织上衣，领口在锁骨上方",
    "棕色横条纹针织衫叠穿浅蓝色条纹衬衫，袖口露出衬衫，圆领，领口在锁骨上方",
    "亮蓝色短款针织开衫叠穿白色打底，圆领，领口在锁骨上方，胸口完全遮住",
    "白色荷叶边上衣，领口在锁骨上方，胸口完全遮住",
    "黑白细条纹长袖，腰间系浅蓝色格子衬衫，圆领，领口在锁骨上方",
    "白色短款圆领T恤，领口在锁骨上方",
    "白色圆领背心，领口在锁骨上方，胸口完全遮住",
    "白色短款圆领上衣，领口在锁骨上方，胸口完全遮住",
  ],
  shoe: [
    "深棕色圆头乐福鞋配白色中筒袜",
    "深棕色圆头系带乐福鞋配白色中筒袜",
    "黑色圆头乐福鞋配白色堆堆袜",
    "卡其色磨砂高筒靴，深棕色皮带扣，配白色中筒袜",
    "米杏色磨砂高筒靴，深棕色皮带扣，配白色中筒袜",
    "黑色带扣短靴",
    "黑色厚底运动鞋",
    "奶油色厚底毛毛雪地靴",
  ],
  acc: [
    "一条黑色细腰带，系在腰间",
    "一只黑色手提包，挎在肩侧，包上挂着浅蓝白色小挂件",
    "一只酒红色带扣双肩包，背带贴合肩部",
    "一顶灰色字母针织冷帽，露出刘海与鬓发，不遮挡眼睛",
    "一顶黑色字母针织冷帽，露出刘海与鬓发，不遮挡眼睛",
    "一只浅黄色手提包，挎在肩侧",
    "一只棕色大号托特包，挎在肩侧",
    "一只棕色手提包，拎在身前",
    "一条米底深色提花针织发带，戴在额头，不遮挡眼睛",
    "一条深色提花围巾，松松围在颈前",
    "一只浅黄色保龄球包，放在身旁或挎在肩侧",
    "一顶深蓝色NY棒球帽，帽檐微压，不遮挡眼睛",
    "一副白色耳罩，戴在耳朵上，不遮挡眼睛",
    "一只浅蓝色大号托特包，挎在肩侧，包上挂着一个白色毛球挂件",
  ],
};
const V23_MERGE: Partial<Record<PoolKey, string[]>> = {
  pose: [
    "双手插在衣兜里，身体微侧，目光看向一侧｜保持双手插兜，随后侧头看向镜头，嘴角微扬",
    "【靠/矮墙】一只手扶着{座}，手里拿着咖啡杯，身体微侧，看向镜头｜保持倚靠的姿态，看向镜头，嘴角微扬",
    "双手插在衣兜里，身体正对镜头，看向镜头｜保持双手插兜，看向镜头，嘴角微扬",
    "【坐/矮墙、长凳】坐在{座}，一只手撑在身侧，另一只手举着手机，看向镜头｜保持坐姿，看向镜头，嘴角微扬",
    "【坐/床】单膝跪在{座}，双手插在衣兜里，看向镜头｜保持跪坐的姿态，看向镜头，嘴角微扬",
    "单手举着手机挡住部分面部自拍，身体正对镜子｜保持自拍的姿态，随后稍微挪开手机，看向镜头，嘴角微扬",
    "【坐/长凳】坐在{座}，双腿自然向前放，上身放松，看向镜头｜保持坐姿，看向镜头，嘴角微扬",
  ],
  bottom: [
    "高腰绿棕红格纹花苞中长裙，裙长过膝近小腿中段",
    "高腰深灰色百褶短裙，裙长到大腿中部",
    "高腰黑色波点短裙，米色圆点，下摆有黑白条纹织边，裙长到大腿中部",
    "米白色高腰阔腿裤，裤脚拖到脚面",
    "黑色运动短裤，裤长到大腿中部",
    "灰色运动短裤，裤长到大腿中部",
    "浅灰色宽松直筒运动裤，裤长到鞋面",
    "紫红色竖条纹高腰阔腿裤，一侧膝盖有破洞，裤脚拖到脚面",
  ],
  inner: [
    "湖蓝色短款针织开衫，白色纽扣，圆领，领口在锁骨上方，胸口完全遮住",
    "腰间系蓝白细格子衬衫，衣摆在髋侧打结，领口在锁骨上方，胸口完全遮住",
    "红白细格纹荷叶边上衣叠穿白底细条纹与白色荷叶边层层下摆，领口在锁骨上方，胸口完全遮住",
    "黑色短款圆领T恤，领口在锁骨上方",
  ],
  shoe: [
    "棕色圆头浅口绑带鞋，米白色交叉鞋带，配橄榄绿中筒袜",
    "米杏色磨砂高筒靴，深棕色皮带扣，配白色堆堆袜",
    "黑色厚底毛毛雪地靴，靴筒上有银色铆钉装饰，配白色堆堆袜",
    "黑色低帮板鞋，白色厚底",
    "深棕色勃肯软木包头拖鞋，皮带扣，配米白色针织堆堆袜",
    "黑色圆头厚底德比鞋，米白色厚底",
  ],
  acc: [
    "一顶驼色报童帽，露出刘海与鬓发，不遮挡眼睛",
    "两枚银色发夹，别在一侧头发上",
    "一只黑色猫咪造型毛绒包，放在身旁或挎在肩侧",
    "一顶黑白条纹针织冷帽，露出刘海与鬓发，不遮挡眼睛",
    "一双黑色短手套",
    "一顶做旧灰色棒球帽，帽檐微压，不遮挡眼睛",
    "一只灰色抽绳双肩包，背在一侧肩上",
  ],
  scene: [
    "街边白色小屋外，浅灰沥青路面浅景深虚化",
    "白砖墙外，白色窗框浅景深虚化",
    "咖啡馆外摆区，深色玻璃橱窗旁有一段浅色矮墙，原木色长凳浅景深虚化",
    "便利店玻璃橱窗前，门内饮料冷柜浅景深虚化",
    "浅色瓷砖外墙边的矮墙，白色窗框浅景深虚化",
    "室内卧室，蓝白红条纹床单浅景深虚化",
    "室内旅店客房，原木色边柜与台灯，旁边有浅色沙发浅景深虚化",
    "红砖墙外人行道，原木色长凳浅景深虚化",
  ],
};
const V24_MERGE: Partial<Record<PoolKey, string[]>> = {
  makeup: [
    "韩系淡妆，眉毛自然修整，眼妆清淡，唇色接近本色",
    "暖调自然妆，眉毛清晰，浅桃色腮红，唇色是柔雾裸粉色",
    "日常薄妆，眉毛清晰，腮红很淡，唇色是雾面裸棕色",
    "水光肌妆，苹果肌打浅桃色腮红，眉毛清晰有型，唇色是水光粉色",
    "粉嫩妆，苹果肌和鼻尖带一点粉色，眉毛细而清晰，唇色是水光玫粉色",
    "冷调薄妆，眉毛又直又清晰，眼妆几乎不加，唇色是哑光裸米色",
  ],
};
const NIGHT_RE = /夜晚|夜间|夜色|漆黑|黑夜里|深夜|夜景|夜拍/;
function dropNight(arr: string[]): string[] {
  return arr.filter((s) => !NIGHT_RE.test(s));
}
const memStore: Record<string, string> = {};

function readStore(k: string): string | null {
  try {
    const v = window.localStorage.getItem(k);
    if (v !== null) return v;
  } catch (e) {}
  return memStore[k] !== undefined ? memStore[k] : null;
}

function writeStore(k: string, v: string): void {
  memStore[k] = v;
  try {
    window.localStorage.setItem(k, v);
  } catch (e) {}
}

const POOL_KEYS: PoolKey[] = ["camera", "pose", "face", "makeup", "bottom", "inner", "shoe", "palette", "acc", "scene", "light", "pal0", "pal1", "pal2", "pal3"];

const LEGACY_FIX: [string, string][] = [
  ["傍晚汉江边的水泥台阶，宽阔的浅灰水泥台阶一级级通向江边，天空由橙色渐变到粉色，对岸是深色的城市天际线剪影", "汉江边的水泥台阶，宽阔的浅灰水泥台阶一级级通向江边，江面开阔，对岸是深色的城市天际线剪影"],
  ["黄昏停车场入口，", "停车场入口，"],
  ["远处是虚化的海面与淡橘色天空，墙边", "远处是虚化的海面，墙边"],
  ["地面为浅灰水泥，墙面落有一道窗影", "地面为浅灰水泥"],
  ["高架桥下，浅灰混凝土桥墩与暖黄色路灯光，地面", "高架桥下，浅灰混凝土桥墩与一盏黑色路灯，地面"],
  ["投影清晰，墙面与地面有真实的反光", "投影清晰，地面与墙面有真实的反光"],
  ["窗内一排滚筒洗衣机虚化", "窗内一排滚筒洗衣机"],
];

const LEGACY_EXACT: [string, string][] = [
  ["保持自拍的姿态，眨一下眼，随后放下手机", "保持自拍的姿态，随后放下手机"],
  ["高腰A字毛呢半裙，裙长到膝上", "高腰A字毛呢半裙，裙长刚到膝盖"],
  ["高腰牛仔短裤，修身，裤长到大腿中上部", "高腰牛仔短裤，修身，裤长到大腿中部"],
  ["高腰毛呢短裤，修身，裤长到大腿中上部", "高腰毛呢短裤，修身，裤长到大腿中部"],
  ["圆润的娃娃脸，无辜的圆眼睛，亚麻茶棕色大波浪长发，两侧留有细碎的鬓发", "圆润的小圆脸，无辜的圆眼睛，亚麻茶棕色大波浪长发，两侧留有细碎的鬓发"],
  ["圆润的娃娃脸，双眼皮杏眼，奶茶棕色中长发半扎，两侧留有碎发", "圆润的小圆脸，双眼皮杏眼，奶茶棕色中长发半扎，两侧留有碎发"],
  ["精致的小脸，微上扬的猫系双眼皮，焦糖茶棕色慵懒长卷发，发尾蓬松，额前留有碎发", "小脸，微上扬的猫系双眼皮，焦糖茶棕色慵懒长卷发，发尾蓬松，额前留有碎发"],
  ["重心落在一条腿上，身体微侧，一只手轻抚发梢，转头看镜头｜指尖把发丝拨到耳后，随即迈出步子", "重心落在一条腿上，身体微侧，一只手自然垂放，正跟拍照的朋友说话，转头看镜头｜说完笑了一下，随即迈出步子"],
  ["一只手轻拨发尾，另一只手自然垂放，转头看镜头｜指尖把发丝拨到肩后，随即迈开步子", "走着走着被朋友叫住，回头看向镜头，一只手自然垂放，笑意自然｜保持回头的姿态，笑了一下，随后继续迈步"],
  ["重心落在后腿上，前腿微屈、脚尖轻点地面，拉长腿部线条，转头看镜头｜从站定的姿态迈出一步，边走边看向镜头", "重心落在后腿上，前腿微屈、脚尖轻点地面，转头看镜头｜从站定的姿态迈出一步，边走边看向镜头"],
  ["看向镜头、嘴角微扬｜低头拨一下发丝，再抬眼看向镜头，笑意浅浅", "看向镜头、嘴角微扬｜低头看了一眼脚边，再抬眼看向镜头，笑意浅浅"],
  ["【坐/台阶、长凳、矮墙】坐在{座}，双腿交叠，一只手托着下巴，另一只手搭在膝上，看向镜头｜保持托腮的姿态，眼神慢慢移向镜头，浅浅一笑", "【坐/台阶、长凳、矮墙】坐在{座}，双腿交叠，一只手搭在膝上，另一只手自然放在身侧，正跟拍照的朋友说话，笑着看向镜头｜笑意慢慢加深，眼神从旁边移向镜头"],
  ["【坐/长凳、台阶、楼梯】坐在{座}，身体微侧，一只手撑在身后，另一只手轻拨发尾，双腿并拢，看向镜头｜指尖把发丝拨到肩后，再转头看向镜头，嘴角微扬", "【坐/长凳、台阶、楼梯】坐在{座}，身体微侧，一只手撑在身后，另一只手自然搭在膝上，双腿并拢，笑着看向镜头｜听到朋友说了句什么，笑着转头看向镜头，嘴角微扬"],
  ["单手举着手机在身前自拍，嘴唇微嘟，目光看向手机屏幕｜", "单手举着手机在身前自拍，目光看向手机屏幕，自然带笑｜"],
  ["一手拿着冰淇淋甜筒凑近嘴边，手肘微收，嘴唇微嘟，眼睛看向镜头｜咬一小口冰淇淋，眨眨眼，随后笑着看向镜头", "一手拿着冰淇淋甜筒，刚咬了一口，手肘微收，眼睛看向镜头｜低头又吃了一口冰淇淋，随后笑着看向镜头"],
  ["双手抬起轻搭在头顶，手肘向外打开，身体微微后倾，歪头看镜头｜双手放下，随手整理一下发丝，随后迈出步子，转头看向镜头", "双手自然垂在身侧，身体微微后倾，被朋友逗笑了，歪头看镜头｜笑着摇了摇头，随后迈出步子，转头看向镜头"],
  ["一只手轻托着脸颊，身体微侧，嘟起嘴看向镜头，另一只手自然垂放｜手从脸颊放下，轻轻一笑，随后迈出步子，转头看向镜头", "一只手轻掩在嘴边，像刚听完朋友的玩笑，忍不住笑，身体微侧，看向镜头，另一只手自然垂放｜手放下来，轻轻一笑，随后迈出步子，转头看向镜头"],
  ["【站//开】一条腿向后微抬，脚尖点地，身体微侧，双手自然垂放，转头嘟嘴看镜头｜抬起的脚轻轻落下，随后迈出步子，转头看向镜头，笑意加深", "【站//开】重心落在一条腿上，另一只脚脚尖点地，身体微侧，双手自然垂放，转头看镜头、笑意自然｜脚轻轻落下，随后迈出步子，转头看向镜头，笑意加深"],
  ["另一只手轻托脸颊，嘟嘴看镜头｜低头抿一口咖啡", "另一只手自然搭在膝边，笑着跟朋友说话，看向镜头｜低头抿一口咖啡"],
  ["【蹲/台阶/开】蹲在{座}，手肘搭在膝上，一只手托着脸颊，嘟起嘴看镜头｜先托着脸颊看向远处，再转头看向镜头，笑意加深", "【蹲/台阶/开】蹲在{座}，手肘搭在膝上，双手自然交握，正跟拍照的朋友说话，抬头看镜头｜先低头笑了笑，再转头看向镜头，笑意加深"],
  ["被朋友逗笑了，歪头看镜头｜", "被朋友逗笑了，笑着看向镜头｜"],
  ["圆润的鹅蛋脸，双眼皮圆眼，卧蚕明显，茶棕色慵懒大波浪长发，发量丰盈，脸侧留有细碎发丝", "圆润鹅蛋脸，双眼皮圆眼，茶棕色慵懒大波浪长发，脸侧有细碎发丝"],
  ["小巧的瓜子脸，清澈的内双大眼，栗棕色大波浪长卷发，发量蓬松，配轻薄的空气刘海", "小巧瓜子脸，清澈内双大眼，栗棕色大波浪长卷发，配轻薄空气刘海"],
  ["圆润的小圆脸，无辜的圆眼睛，亚麻茶棕色大波浪长发，两侧留有细碎的鬓发", "小圆脸，无辜圆眼睛，亚麻茶棕色大波浪长发，两侧有细碎鬓发"],
  ["小脸，微上扬的猫系双眼皮，焦糖茶棕色慵懒长卷发，发尾蓬松，额前留有碎发", "小脸，微上扬的猫系双眼皮，焦糖茶棕色慵懒长卷发，额前有碎发"],
  ["清秀的鹅蛋脸，笑起来有卧蚕的月牙眼，栗棕色大波浪长发，一侧别在耳后，脸侧留有细碎发丝", "清秀鹅蛋脸，笑起来有卧蚕的月牙眼，栗棕色大波浪长发，一侧别在耳后"],
  ["偏圆的小脸，自然内双的杏仁眼，深茶棕色长波浪卷发配外八字刘海", "偏圆小脸，自然内双杏仁眼，深茶棕色长波浪卷发配外八字刘海"],
  ["秀气的心形脸，眼尾微垂的无辜眼，浅茶棕色大波浪长发，发量丰盈，脸侧有几缕碎发", "秀气心形脸，眼尾微垂的无辜眼，浅茶棕色大波浪长发，脸侧有碎发"],
  ["鹅蛋脸，清澈中带一点酷感的内双眼，深栗棕色大波浪长卷发配饺子式外八字刘海", "鹅蛋脸，带一点酷感的内双眼，深栗棕色大波浪长卷发配外八字刘海"],
  ["小脸，眼睛大而有神，黑棕色小羊卷中长发，额前留有碎发", "小脸，大而有神的眼睛，黑棕色小羊卷中长发，额前有碎发"],
  ["圆润的小圆脸，双眼皮杏眼，奶茶棕色中长发半扎，两侧留有碎发", "小圆脸，双眼皮杏眼，奶茶棕色中长发半扎，两侧有碎发"],
  ["小巧的鹅蛋脸，卧蚕笑眼，深棕色中长直发配公主切", "小巧鹅蛋脸，卧蚕笑眼，深棕色中长直发配公主切"],
  ["小巧的瓜子脸，单眼皮微上扬、笑起来很甜，黑色及肩短发配齐刘海", "小巧瓜子脸，单眼皮微上扬，黑色及肩短发配齐刘海"],
  ["首尔住宅区红砖楼外墙，暗红色清水砖墙配一段黑色铁艺外楼梯，墙角一个旧式黑色信箱，地面为浅灰水泥", "首尔住宅区红砖楼外墙，暗红色清水砖墙配黑色铁艺外楼梯，地面为浅灰水泥"],
  ["书店橱窗前，深木色窗框与整面落地玻璃，橱窗里竖立几本封面素净的书，玻璃上映着暖色灯光", "书店橱窗前，深木色窗框与整面落地玻璃，橱窗里几本封面素净的书"],
  ["面包房木门前，原木色实木门与奶油色瓷砖墙面，门旁一块小黑板菜单和一只藤编篮", "面包房木门前，原木色实木门与奶油色瓷砖墙面，门旁一块小黑板菜单"],
  ["地铁站出口，白色瓷砖墙与银灰色金属扶手，台阶口透出暖黄色顶灯，地面为浅灰防滑石材", "地铁站出口，白色瓷砖墙与银灰色金属扶手，台阶口透出暖黄色顶灯"],
  ["天桥上，浅灰水泥桥面带黄色边线，银灰色金属护栏，远处是虚化的暖色天际线与楼群", "天桥上，浅灰水泥桥面带黄色边线，银灰色金属护栏，远处是暖色天际线"],
  ["小巷水泥台阶，浅灰粗糙水泥墙与三级台阶，墙上一盏旧式壁灯和一根白色线管", "小巷水泥台阶，浅灰粗糙水泥墙与三级台阶，墙上一盏旧式壁灯"],
  ["老式电影院门口，米色水磨石外墙与深红色大门，门边一个素净的玻璃海报框", "老式电影院门口，米色水磨石外墙与深红色大门"],
  ["便利店门口，白色铝框玻璃门与浅灰地砖，门边一台灰白色自动贩卖机和一个银色垃圾桶", "便利店门口，白色铝框玻璃门与浅灰地砖，门边一台灰白色自动贩卖机"],
  ["停车场入口，浅灰混凝土立柱与黄黑相间的道闸杆，背后是暗红色砖墙，地面空旷", "停车场入口，浅灰混凝土立柱与黄黑相间的道闸杆，背后是暗红色砖墙"],
  ["海边堤道，灰白色石砌矮墙与浅色混凝土步道，远处是虚化的海面，墙边一排白色系船桩", "海边堤道，灰白色石砌矮墙与浅色混凝土步道，远处是海面"],
  ["白色美术馆外墙，大面积哑光白墙配细长的玻璃窗缝，地面为浅灰石板，墙角嵌着一盏地灯", "白色美术馆外墙，大面积哑光白墙配细长的玻璃窗缝，地面为浅灰石板"],
  ["冬季枯枝下的人行道，浅灰色砖石墙前，头顶是几根纤细无叶的枯枝虚化剪影，地面铺米色方砖，墙边一盏黑色路灯", "冬季枯枝下的人行道，浅灰砖石墙前，头顶几根无叶的枯枝剪影，地面铺米色方砖"],
  ["高架桥下，浅灰混凝土桥墩与一盏黑色路灯，地面为深灰沥青，桥墩上一道白色标线", "高架桥下，浅灰混凝土桥墩与一盏黑色路灯，地面为深灰沥青"],
  ["日式住宅街角，米色灰泥外墙与深木色格栅门，门前一盏方形纸罩壁灯和一只小木信箱", "日式住宅街角，米色灰泥外墙与深木色格栅门，门前一盏方形纸罩壁灯"],
  ["深灰蓝色卷帘门前，金属卷帘门配米色涂料墙面，门边一盏暖黄色壁灯，地面为浅灰水泥", "深灰蓝色卷帘门前，金属卷帘门配米色涂料墙面，门边一盏暖黄色壁灯"],
  ["日式木造住宅外墙，深棕色烧杉木板墙，门前一块石板踏步和一盏方形壁灯", "日式木造住宅外墙，深棕色烧杉木板墙，门前一块石板踏步"],
  ["韩式小店街角，浅石材与水泥拼接的墙面，配细黑金属窗框，墙上一盏暖色壁灯", "韩式小店街角，浅石材与水泥拼接的墙面，配细黑金属窗框"],
  ["大学校园红砖教学楼前，暗红色清水砖墙配白色窗框，门前几级浅灰色台阶，门边一块素净的告示牌，此刻空无一人", "大学校园红砖教学楼前，暗红色清水砖墙配白色窗框，门前几级浅灰色台阶，此刻空无一人"],
  ["大学图书馆台阶前，米色石材外墙与深色玻璃门，门前一段宽阔的浅灰色台阶，台阶旁一盏方形壁灯，地面空旷", "大学图书馆台阶前，米色石材外墙与深色玻璃门，门前一段宽阔的浅灰色台阶，地面空旷"],
  ["校门口小吃街，浅灰水泥墙面与一扇关着的白色卷帘门，门边一块手写菜单小黑板，墙上一盏暖黄色壁灯，此刻没有行人", "校门口小吃街，浅灰水泥墙面与一扇关着的白色卷帘门，门边一块小黑板，此刻没有行人"],
  ["弘大风格街角，奶油色涂装的砖墙配一段齐腰的水泥矮墙，墙上一幅色调素净的几何壁画，旁边一根黑色金属路灯，地面为浅灰砖石", "弘大风格街角，奶油色涂装的砖墙配一段齐腰的水泥矮墙，墙上一幅素净的几何壁画"],
  ["大学路上的奶茶店门口，奶油色外墙与木框玻璃门，门边一块小黑板菜单和一条原木色长凳，门楣挂着一串暖色小灯，门口没有排队的人", "大学路上的奶茶店门口，奶油色外墙与木框玻璃门，门边一块小黑板和一条原木色长凳，门口没有排队的人"],
  ["弘大涂鸦卷帘门前，银色金属卷帘门上满是抽象彩色涂鸦，门旁是浅灰水泥墙面，门前是浅灰人行道与一级低矮的路缘台阶，此刻没有行人", "弘大涂鸦卷帘门前，银色金属卷帘门上满是抽象彩色涂鸦，门旁浅灰水泥墙面，门前一级低矮的路缘台阶，此刻没有行人"],
  ["弘大路口的人行横道上，深灰色柏油路面画着白色斑马线与白色路面标线，路边是一段浅灰水泥墙面，此刻路上没有车辆与行人", "弘大路口的人行横道上，深灰色柏油路面画着白色斑马线，路边一段浅灰水泥墙面，此刻没有车辆与行人"],
  ["弘大混凝土墙前，整面浅灰清水混凝土墙上整齐地网格状张贴着同一张无可读文字的简约插画海报，地面为深灰沥青，墙脚有一级低矮的水泥台阶", "弘大混凝土墙前，整面浅灰清水混凝土墙上网格状张贴着同一张简约插画海报，地面为深灰沥青，墙脚一级低矮的水泥台阶"],
  ["弘大贴满贴纸的黑色墙面前，黑色墙面与配电箱上贴满抽象图案的贴纸和小标签，无可读文字，墙前有两级低矮的水泥台阶，此刻没有行人", "弘大贴满贴纸的黑色墙面前，墙面与配电箱上贴满抽象图案的贴纸，墙前两级低矮的水泥台阶，此刻没有行人"],
  ["弘大红砖涂鸦墙前，暗红色砖墙上有手写感的抽象彩色涂鸦，旁边是一扇白色小铁门，地面为浅灰水泥，墙脚有一级低矮的台阶", "弘大红砖涂鸦墙前，暗红色砖墙上有抽象彩色涂鸦，旁边一扇白色小铁门，墙脚一级低矮的台阶"],
  ["弘大路边铁艺护栏旁，黑色铁艺护栏与黄黑相间的警示立柱，远处一辆虚化的公交车，车身无可读文字，灰色柏油路面与浅灰砖石人行道，此刻没有行人", "弘大路边铁艺护栏旁，黑色铁艺护栏与黄黑相间的警示立柱，灰色柏油路面与浅灰砖石人行道，此刻没有行人"],
  ["弘大白色店面门口，白色外墙与整面玻璃门窗，门前一条黑色长凳，招牌无可读文字，地面为浅灰石板，此刻没有行人", "弘大白色店面门口，白色外墙与整面玻璃门窗，门前一条黑色长凳，地面为浅灰石板，此刻没有行人"],
  ["圣水洞红砖仓库外墙，暗红色清水砖墙配一扇黑色铁门，地面为深灰水泥，门前有两级低矮的水泥台阶，此刻没有行人", "圣水洞红砖仓库外墙，暗红色清水砖墙配一扇黑色铁门，门前两级低矮的水泥台阶，此刻没有行人"],
  ["大学校园石阶旁，一段宽阔的浅灰色石阶，石阶一侧是浅灰石栏，背后是米色的老式石砌建筑外墙，此刻空无一人", "大学校园石阶旁，一段宽阔的浅灰色石阶，一侧浅灰石栏，背后是米色的石砌建筑外墙，此刻空无一人"],
  ["校园里的木质长椅旁，原木色木质长椅靠在暗红色清水砖墙前，墙的一侧衔接一段浅色石墙，地面为浅灰色石板路，此刻空无一人", "校园里的木质长椅旁，原木色木质长椅靠在暗红色清水砖墙前，地面为浅灰色石板路，此刻空无一人"],
  ["汉江边的水泥台阶，宽阔的浅灰水泥台阶一级级通向江边，江面开阔，对岸是深色的城市天际线剪影，台阶旁没有草地，此刻没有行人", "汉江边的水泥台阶，浅灰水泥台阶一级级通向江边，江面开阔，对岸是深色的城市剪影，台阶旁没有草地，此刻没有行人"],
  ["傍晚夕阳的暖金色侧逆光，发丝与衣缘呈暖金色，面部有来自地面与墙面的反射光，接地阴影真实自然，整体偏暖调", "傍晚夕阳的暖金色侧逆光，发丝与衣缘呈暖金色，面部有来自地面与墙面的反射光"],
  ["日落后橘粉色的晚霞天光，天空由橘红渐变到粉紫，天光带一点暖橘色自然落在人物身上，影子很淡", "日落后橘粉色的晚霞天光，天空由橘红渐变到粉紫，暖橘色天光落在人物身上，影子很淡"],
  ["夜间相机直闪，闪光照亮人物，背景保持深色有层次，近处略亮、远处渐暗", "夜间相机直闪，闪光照亮人物，背景深色有层次，近亮远暗"],
  ["雾白奶油色调，柔和的散射日光，整体偏奶油、米白、浅粉的低饱和柔雾感，光线均匀、阴影很浅，肤色白皙自然，画面轻微柔焦、带一点雾感", "雾白奶油色调，柔和的散射日光，偏奶油、米白、浅粉的低饱和柔雾感，阴影很浅，肤色白皙自然，轻微柔焦"],
  ["低保真数码相机感，早期CCD卡片机的闪光灯随手抓拍，画面带轻微模糊与细腻颗粒、轻微偏色，可带轻微运动拖影，生活感随手拍", "低保真数码相机感，早期CCD卡片机闪光灯随手抓拍，画面带轻微模糊、细腻颗粒与偏色，可带轻微运动拖影"],
  ["0.5x超广角低机位仰拍全身，腿部拉长但不畸变失真，羽绒服版型不变形", "齐胸平拍"],
  ["0.5x超广角低机位仰拍全身，腿部拉长不畸变，版型不变形", "齐胸平拍"],
  ["，包带不遮挡羽绒服门襟与左胸贴袋", ""],
  ["，不遮挡羽绒服门襟与左胸贴袋", ""],
  ["，不遮挡羽绒服门襟与领口", ""],
  ["，杯子不遮挡门襟与左胸贴袋", ""],
  ["，帽檐下露出刘海与鬓发，长发自然垂在两侧，不遮挡眼睛", "，露出刘海与鬓发，不遮挡眼睛"],
  ["，帽檐微微压低，长发自然垂在两侧，不遮挡眼睛", "，帽檐微压，不遮挡眼睛"],
  ["，帽檐下露出刘海与鬓发，长发自然垂在两侧", "，露出刘海与鬓发"],
  ["，系在头顶，长发自然垂在两侧", "，系在头顶"],
  ["，戴在头顶，长发垂在两侧", "，戴在头顶"],
  ["，腿套堆在脚踝到小腿，腿套内可配一双短袜", "，堆在脚踝到小腿"],
  ["，衣长盖住腰腹", ""],
  ["衬衫领口扣好并露出翻领，针织衫圆领，", "衬衫领扣好露出翻领，圆领，"],
  ["，纽扣扣到胸口以上，衬衫领口扣好，", "，纽扣扣好，"],
  ["衬衫扣到最顶一颗、领带系到领口最顶端，可叠穿修身针织背心，领带只用配色中的一种颜色", "衬衫扣到最顶、领带系到领口，可叠穿针织背心，领带只用一种配色"],
  ["纽扣全部扣好", "纽扣扣好"],
  ["，翻领整齐露出", ""],
  ["格纹只用配色中的两种颜色", "格纹只用两种配色"],
  ["羽绒服敞开时只露出领口与前襟一小片红色", "只在领口与前襟露出一小片红色"],
  ["高腰牛仔短裤，修身，裤长到大腿中部", "高腰牛仔百慕大短裤，裤长到膝盖"],
  ["高腰毛呢短裤，修身，裤长到大腿中部", "高腰毛呢百慕大短裤，裤长到膝盖"],
  ["高腰百褶裙", "高腰百褶中裙"],
  ["格纹百褶裙", "格纹百褶中裙"],
  ["蓬蓬蛋糕裙", "蓬蓬蛋糕中裙"],
  ["奶白色A字裙", "奶白色A字中裙"],
  ["高腰牛仔裙", "高腰牛仔中裙"],
  ["A字毛呢半裙", "A字毛呢中裙"],
  ["灯芯绒A字裙", "灯芯绒A字中裙"],
  ["裙长刚到膝盖", "裙长刚过膝盖"],
];

function fixExact(arr: string[]): string[] {
  return arr.map((s) => LEGACY_EXACT.reduce((acc, p) => acc.split(p[0]).join(p[1]), s));
}

function fixLegacyPose(arr: string[]): string[] {
  return arr
    .map((s) => s.replace("【靠/栏杆、墙面】", "【靠/栏杆】"))
    .filter((s) => s.indexOf("背靠") < 0 && s.indexOf("轻靠在身旁的墙边") < 0 && s.indexOf("【靠/墙面】") < 0);
}

function fixLegacy(arr: string[]): string[] {
  return arr.map((s) => LEGACY_FIX.reduce((acc, p) => acc.split(p[0]).join(p[1]), s));
}

function loadPools(): Pools {
  const out = {} as Pools;
  let saved: Record<string, unknown> = {};
  let migrated = false;
  let cameraCulled = false;
  let accCulled = false;
  let poolMerged = false;
  try {
    let raw = readStore(POOL_KEY);
    if (!raw) {
      raw = readStore(POOL_LEGACY) || readStore(POOL_LEGACY2) || readStore(POOL_LEGACY3);
      if (raw) migrated = true;
    }
    if (raw) saved = JSON.parse(raw);
  } catch (e) {}
  for (const k of POOL_KEYS) {
    const s = saved[k];
    if (Array.isArray(s) && s.length > 0 && s.every((x) => typeof x === "string")) {
      let arr = k === "scene" || k === "light" ? fixExact(fixLegacy(s as string[])) : k === "pose" ? fixExact(fixLegacyPose(s as string[])) : fixExact(s as string[]);
      if (k === "pose") {
        const np = arr.length;
        arr = fixLegacyPose(arr);
        if (arr.length < np) migrated = true;
        if (arr.length === 0) arr = DEFAULT_POOLS.pose.slice();
      }
      if (k === "scene" || k === "light") {
        const n = arr.length;
        arr = dropNight(arr);
        if (arr.length < n) migrated = true;
        if (arr.length === 0) arr = DEFAULT_POOLS[k].slice();
      }
      if (k === "camera") {
        const nc = arr.length;
        arr = arr.filter((s) => s.indexOf("超广角") < 0 && s.indexOf("0.5x") < 0);
        if (arr.length === 0) arr = DEFAULT_POOLS.camera.slice();
        else if (arr.length < nc) cameraCulled = true;
      }
      if (k === "acc") {
        const na = arr.length;
        arr = arr.filter((s) => s.indexOf("毛绒卡通") < 0 && s.indexOf("玩偶围脖") < 0);
        if (arr.length === 0) arr = DEFAULT_POOLS.acc.slice();
        else if (arr.length < na) accCulled = true;
      }
      if (k === "bottom") {
        const nb = arr.length;
        arr = arr.filter((s) => s.indexOf("紧身裤") < 0);
        if (arr.length < nb) migrated = true;
        if (arr.length === 0) arr = DEFAULT_POOLS.bottom.slice();
      }
      if (k === "scene") {
        const nb = arr.length;
        arr = arr.filter((s) => s.indexOf("长椅") < 0 && s.indexOf("纯色背景墙") < 0);
        if (arr.length < nb) migrated = true;
        if (arr.length === 0) arr = DEFAULT_POOLS.scene.slice();
        arr = arr.map((s) => s.indexOf("她手持手机对着镜面自拍") >= 0 ? s.replace("她手持手机对着镜面自拍", "她手持配小熊卡通壳的手机对着镜面自拍") : s);
      }
      const add = V11_MERGE[k];
      if (add) for (const x of add) if (arr.indexOf(x) < 0) { arr.push(x); migrated = true; }
      const add22 = V22_MERGE[k];
      if (add22) for (const x of add22) if (arr.indexOf(x) < 0) { arr.push(x); poolMerged = true; }
      const add23 = V23_MERGE[k];
      if (add23) for (const x of add23) if (arr.indexOf(x) < 0) { arr.push(x); poolMerged = true; }
      const add24 = V24_MERGE[k];
      if (add24) for (const x of add24) if (arr.indexOf(x) < 0) { arr.push(x); poolMerged = true; }
      out[k] = arr;
    } else out[k] = DEFAULT_POOLS[k].slice();
  }
  if (migrated) {
    out.scene = DEFAULT_POOLS.scene.slice();
    writeStore(POOL_KEY, JSON.stringify(out));
  } else if (cameraCulled || accCulled || poolMerged) {
    writeStore(POOL_KEY, JSON.stringify(out));
  }
  return out;
}

function loadHistory(): Snap[] {
  try {
    const raw = readStore(HIST_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((h) => h && h.vals && typeof h.tpl === "number" && SLOTS.every((d) => d.key === "makeup" || Array.isArray(h.vals[d.key])))
      .slice(0, 5) as Snap[];
  } catch (e) {
    return [];
  }
}

function loadPrefs(): { jacket: number; faceRef: boolean; imgModel: ImgModel; vidModel: VidModel } {
  try {
    let raw = readStore(PREF_KEY);
    let fromLegacy = false;
    if (!raw) {
      raw = readStore(PREF_LEGACY);
      fromLegacy = !!raw;
    }
    if (raw) {
      const p = JSON.parse(raw);
      const j = typeof p.jacket === "number" && p.jacket >= 0 && p.jacket < JACKETS.length ? p.jacket : 0;
      const im: ImgModel = p.imgModel === "nano" ? "nano" : "gpt";
      const vm: VidModel = p.vidModel === "kling" ? "kling" : "seedance";
      return { jacket: j, faceRef: fromLegacy ? false : p.faceRef === true, imgModel: im, vidModel: vm };
    }
  } catch (e) {}
  return { jacket: 0, faceRef: false, imgModel: "gpt", vidModel: "seedance" };
}

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (e) {}
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch (e) {
    return false;
  }
}

function chipText(key: SlotKey, v: string[], scene: string): string {
  const s = v.join("、");
  if (key === "pose") return poseText(v[0] || "", scene).split("，")[0];
  if (key === "face") return "长相：" + (v[0] || "").split("，")[0];
  if (key === "makeup") return "妆容：" + (v[0] || "").split("，")[0];
  if (key === "scene") return (v[0] || "").split("，")[0];
  if (key === "light") return "光线：" + (v[0] || "").split("，")[0];
  if (key === "bottom") return s.split("，")[0];
  return s;
}

const NO_LOCKS: Locks = { camera: false, pose: false, face: false, makeup: false, bottom: false, inner: false, shoe: false, palette: false, acc: false, scene: false, light: false };

type Init = { pools: Pools; vals: Vals; tpl: number; history: Snap[]; jacket: number; faceRef: boolean; imgModel: ImgModel; vidModel: VidModel };

function makeInit(): Init {
  const pools = loadPools();
  const hist = loadHistory();
  const prefs = loadPrefs();
  const vals = drawAll(pools, null, NO_LOCKS, hist, prefs.jacket);
  const tpl = drawTpl(hist, isSeated(vals));
  return { pools, vals, tpl, history: [{ vals, tpl } as Snap].concat(hist).slice(0, 5), jacket: prefs.jacket, faceRef: prefs.faceRef, imgModel: prefs.imgModel, vidModel: prefs.vidModel };
}

const EDIT_KEYS: { key: PoolKey; label: string }[] = [
  { key: "pose", label: "姿态与动作（格式：图片姿态｜视频动作。可加标签【坐/台阶、长凳/开】，{座}会换成场景里的座位，开表示腿部张开，裙装不会抽到）" },
  { key: "face", label: "模特长相" },
  { key: "makeup", label: "妆容" },
  { key: "bottom", label: "下装" },
  { key: "inner", label: "内搭" },
  { key: "shoe", label: "鞋型" },
  { key: "pal0", label: "搭配色（米白羽绒服）" },
  { key: "pal1", label: "搭配色（芥末黄羽绒服）" },
  { key: "pal2", label: "搭配色（黑色羽绒服）" },
  { key: "pal3", label: "搭配色（米白连帽羽绒服）" },
  { key: "acc", label: "配饰" },
  { key: "scene", label: "场景（每项第一个逗号前为标签名）" },
  { key: "light", label: "光线（每项一句完整的光线描述；常规光线只写光源与环境反光，饱和度与真实感由模板统一补充，雾白奶油与低保真两类按各自风格写，名称含「雾白奶油」或「低保真」）" },
  { key: "camera", label: "机位" },
];

function LockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <rect x="2.2" y="5.4" width="7.6" height="5" rx="1.2" />
      <path d="M4 5.4V3.8a2 2 0 0 1 4 0v1.6" />
    </svg>
  );
}

export default function App() {
  const theme = useGrokTheme();
  const [init] = useState<Init>(() => makeInit());
  const [pools, setPools] = useState<Pools>(init.pools);
  const [vals, setVals] = useState<Vals>(init.vals);
  const [tpl, setTpl] = useState<number>(init.tpl);
  const [history, setHistory] = useState<Snap[]>(init.history);
  const [locks, setLocks] = useState<Locks>(NO_LOCKS);
  const [jacket, setJacket] = useState<number>(init.jacket);
  const [faceRef, setFaceRef] = useState<boolean>(init.faceRef);
  const [imgModel, setImgModel] = useState<ImgModel>(init.imgModel);
  const [vidModel, setVidModel] = useState<VidModel>(init.vidModel);
  const [tplLock, setTplLock] = useState<boolean>(false);
  const [music, setMusic] = useState<string>(() => MUSIC_OPTS[rnd(MUSIC_OPTS.length)].value);
  const [musicLock, setMusicLock] = useState<boolean>(false);
  const [copied, setCopied] = useState<string>("");
  const [editKey, setEditKey] = useState<PoolKey>("bottom");
  const [editText, setEditText] = useState<string>(init.pools.bottom.join("\n"));
  const [editMsg, setEditMsg] = useState<string>("");

  useEffect(() => {
    writeStore(HIST_KEY, JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    writeStore(PREF_KEY, JSON.stringify({ jacket: jacket, faceRef: faceRef, imgModel: imgModel, vidModel: vidModel }));
  }, [jacket, faceRef, imgModel, vidModel]);

  const imageText = imageFor(imgModel, vals, jacket, faceRef);
  const videoText = videoFor(vidModel, vals, tpl, music, jacket);
  const imgName = imgModel === "nano" ? "Nano Banana" : "GPT Image 2";
  const vidName = vidModel === "kling" ? "可灵 4.0" : "Seedance 2.0 Fast";

  const doDraw = () => {
    const nv = drawAll(pools, vals, locks, history, jacket);
    const nt = tplLock && !!TEMPLATES[tpl].seated === isSeated(nv) ? tpl : drawTpl(history, isSeated(nv));
    setVals(nv);
    setTpl(nt);
    if (!musicLock) {
      const opts = MUSIC_OPTS.map((o) => o.value);
      const pool = opts.length > 1 ? opts.filter((x) => x !== music) : opts;
      setMusic(pool[rnd(pool.length)]);
    }
    setHistory([{ vals: nv, tpl: nt } as Snap].concat(history).slice(0, 5));
    setCopied("");
  };

  const chooseJacket = (j: number) => {
    if (j === jacket) return;
    const palDef = SLOTS.filter((d) => d.key === "palette")[0];
    const nv: Vals = { ...vals, palette: drawSlot(palDef, pools, history, j) };
    setJacket(j);
    setVals(nv);
    setLocks({ ...locks, palette: false });
    setHistory([{ vals: nv, tpl } as Snap].concat(history.slice(1)));
    setCopied("");
  };

  const lockCount = SLOTS.filter((d) => locks[d.key]).length + (tplLock ? 1 : 0) + (musicLock ? 1 : 0);

  const unlockAll = () => {
    setLocks(NO_LOCKS);
    setTplLock(false);
    setMusicLock(false);
  };

  const rerollTpl = () => {
    const nt = drawTpl(history, isSeated(vals));
    setTpl(nt);
    setHistory([{ vals, tpl: nt } as Snap].concat(history.slice(1)));
  };

  const pickTpl = (s: string) => {
    const nt = Number(s);
    setTpl(nt);
    setHistory([{ vals, tpl: nt } as Snap].concat(history.slice(1)));
  };

  const doCopy = async (which: string, text: string) => {
    const ok = await copyText(text);
    setCopied(ok ? which : "fail");
  };

  const chooseEdit = (k: string) => {
    const key = k as PoolKey;
    setEditKey(key);
    setEditText(pools[key].join("\n"));
    setEditMsg("");
  };

  const savePool = () => {
    const lines = editText.split("\n").map((x) => x.trim()).filter((x) => x.length > 0);
    const uniq = lines.filter((x, i) => lines.indexOf(x) === i);
    if (uniq.length === 0) {
      setEditMsg("至少保留一行。");
      return;
    }
    const np: Pools = { ...pools, [editKey]: uniq };
    setPools(np);
    writeStore(POOL_KEY, JSON.stringify(np));
    setEditText(uniq.join("\n"));
    setEditMsg("已保存，共 " + uniq.length + " 项，下次换一组生效。");
  };

  const resetPool = () => {
    const d = DEFAULT_POOLS[editKey].slice();
    const np: Pools = { ...pools, [editKey]: d };
    setPools(np);
    writeStore(POOL_KEY, JSON.stringify(np));
    setEditText(d.join("\n"));
    setEditMsg("已恢复默认。");
  };

  const boxStyle = {
    border: "1px solid " + theme.border.default,
    borderRadius: theme.radius.lg,
    padding: 16,
    whiteSpace: "pre-wrap" as const,
    overflowWrap: "anywhere" as const,
    userSelect: "text" as const,
    color: theme.text.primary,
    fontFamily: theme.font.family,
    fontSize: theme.font.body2.fontSize,
    lineHeight: theme.font.body2.lineHeight,
  };

  const smallLabel = {
    fontFamily: theme.font.family,
    fontSize: theme.font.label.fontSize,
    lineHeight: theme.font.label.lineHeight,
    color: theme.text.tertiary,
  };

  const chipBase = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    maxWidth: "100%",
    padding: "6px 12px",
    borderRadius: theme.radius.full,
    fontFamily: theme.font.family,
    fontSize: theme.font.label.fontSize,
    lineHeight: theme.font.label.lineHeight,
    color: theme.text.primary,
    textAlign: "left" as const,
    cursor: "pointer",
  };

  const copyLabel = (which: string, base: string) => (copied === which ? "已复制" : base);

  const refLine = faceRef ? "上传顺序：图1 衣服正面，图2 衣服背面，图3 脸参考图。" : "上传顺序：图1 衣服正面，图2 衣服背面。";
  const vidRef = vidModel === "kling" ? "把生成好的图片上传为图片1并设为首帧。" : "把生成好的图片上传为图片1。";

  return (
    <Page title="韩系羽绒服街拍 · 提示词抽卡器" summary={PAGE_VER + "。先选颜色，再抽选项，最后生成并复制提示词。"}>
      <Section heading="第一步：选羽绒服颜色">
        <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 12 }}>
          {JACKETS.map((j, i) => {
            const on = i === jacket;
            return (
              <button
                key={j.name}
                onClick={() => chooseJacket(i)}
                aria-pressed={on}
                style={{
                  flex: "1 1 90px",
                  maxWidth: 180,
                  display: "flex",
                  flexDirection: "column" as const,
                  alignItems: "center",
                  gap: 6,
                  padding: 6,
                  background: on ? theme.fill.secondary : "transparent",
                  color: theme.text.primary,
                  border: "1px solid " + (on ? theme.border.strong : theme.border.default),
                  outline: on ? "3px solid " + theme.text.primary : "none",
                  outlineOffset: 2,
                  borderRadius: theme.radius.lg,
                  fontFamily: theme.font.family,
                  fontSize: theme.font.label.fontSize,
                  lineHeight: theme.font.label.lineHeight,
                  fontWeight: on ? 600 : 400,
                  cursor: "pointer",
                }}
              >
                <div style={{ width: "100%", aspectRatio: "1 / 1", background: j.hex, borderRadius: theme.radius.md, overflow: "hidden" }}>
                  <img
                    src={JACKET_IMG[i]}
                    alt={j.name + "羽绒服"}
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                    style={{ width: "100%", height: "100%", objectFit: "cover" as const, display: "block", opacity: on ? 1 : 0.7 }}
                  />
                </div>
                <span>{on ? "✓ " + j.name : j.name}</span>
              </button>
            );
          })}
        </div>
      </Section>

      <Section heading="第二步：抽选项">
        <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8 }}>
          <button
            onClick={() => setFaceRef(!faceRef)}
            style={{
              ...chipBase,
              border: "1px solid " + (faceRef ? theme.border.strong : theme.border.default),
              background: faceRef ? theme.fill.secondary : "transparent",
            }}
          >
            {faceRef ? "脸参考图3：开" : "脸参考图3：关"}
          </button>
          {SLOTS.filter((d) => !(d.key === "face" && faceRef) && !(d.key === "inner" && (vals.bottom[0] || "").indexOf("连衣裙") >= 0)).map((d) => {
            const on = locks[d.key];
            return (
              <button
                key={d.key}
                onClick={() => setLocks({ ...locks, [d.key]: !on })}
                style={{
                  ...chipBase,
                  border: "1px solid " + (on ? theme.border.strong : theme.border.default),
                  background: on ? theme.fill.secondary : "transparent",
                }}
              >
                {on ? <LockIcon /> : null}
                <span style={{ overflowWrap: "anywhere" as const }}>{chipText(d.key, vals[d.key], vals.scene[0] || "")}</span>
              </button>
            );
          })}
          <button
            onClick={() => setMusicLock(!musicLock)}
            style={{
              ...chipBase,
              border: "1px solid " + (musicLock ? theme.border.strong : theme.border.default),
              background: musicLock ? theme.fill.secondary : "transparent",
            }}
          >
            {musicLock ? <LockIcon /> : null}
            <span style={{ overflowWrap: "anywhere" as const }}>{"配乐：" + ((MUSIC_OPTS.find((o) => o.value === music) || MUSIC_OPTS[0]).label)}</span>
          </button>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap" as const, alignItems: "center", gap: 12 }}>
          <Button label="全部解锁" onClick={unlockAll} disabled={lockCount === 0} />
          <div style={smallLabel}>{lockCount > 0 ? "已锁定 " + lockCount + " 项，换一组时保持不变。" : "点标签可锁定，换一组时保持不变。"}</div>
        </div>
      </Section>

      <Section heading="第三步：生成提示词">
        <Button label="换一组" variant="primary" onClick={doDraw} />
        <div style={smallLabel}>生图模型</div>
        <Segmented options={IMG_MODELS} value={imgModel} onChange={(v: string) => setImgModel(v === "nano" ? "nano" : "gpt")} />
        <Button label={copyLabel("img", "复制 " + imgName + " 生图提示词")} variant="primary" onClick={() => doCopy("img", imageText)} />
        <div style={boxStyle}>{imageText}</div>
        <div style={smallLabel}>{refLine}</div>
        <div style={smallLabel}>视频模型</div>
        <Segmented options={VID_MODELS} value={vidModel} onChange={(v: string) => setVidModel(v === "kling" ? "kling" : "seedance")} />
        <Button label={copyLabel("vid", "复制 " + vidName + " 视频提示词")} variant="primary" onClick={() => doCopy("vid", videoText)} />
        <div style={boxStyle}>{videoText}</div>
        <div style={smallLabel}>{"分镜：" + TEMPLATES[tpl].name + "。" + vidRef}</div>
        {copied === "fail" ? <Text>当前环境不允许自动复制，请长按选中文字后复制。</Text> : null}
      </Section>

      <Section heading="高级设置" collapsible defaultOpen={false}>
        <Select label="分镜模板" options={TEMPLATES.map((t, i) => ({ value: String(i), label: t.name }))} value={String(tpl)} onChange={pickTpl} />
        <div style={{ display: "flex", flexWrap: "wrap" as const, alignItems: "center", gap: 12 }}>
          <Toggle label="锁定分镜" value={tplLock} onChange={setTplLock} />
          <Button label="重抽分镜" onClick={rerollTpl} />
        </div>
        <Segmented
          options={MUSIC_OPTS.map((o) => ({ value: o.value, label: o.label }))}
          value={music}
          onChange={setMusic}
        />
        <div style={smallLabel}>换一组时会随机配乐，点上方配乐标签可锁定；手动点选仍可覆盖。AI 歌词人声可能含糊，商用投放可另配授权音乐。</div>
        <Select
          label="编辑选项池，每行一项"
          options={EDIT_KEYS.map((d) => ({ value: d.key, label: d.label + "（" + pools[d.key].length + " 项）" }))}
          value={editKey}
          onChange={chooseEdit}
        />
        {editKey === "pose" ? <div style={smallLabel}>姿态用「｜」分隔，左边写图片姿态，右边写视频开场动作。</div> : null}
        <textarea
          value={editText}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setEditText(e.target.value)}
          rows={10}
          style={{
            width: "100%",
            boxSizing: "border-box" as const,
            border: "1px solid " + theme.border.default,
            borderRadius: theme.radius.md,
            padding: 12,
            background: "transparent",
            color: theme.text.primary,
            fontFamily: theme.font.family,
            fontSize: theme.font.body2.fontSize,
            lineHeight: theme.font.body2.lineHeight,
            resize: "vertical" as const,
          }}
        />
        <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8 }}>
          <Button label="保存" variant="primary" onClick={savePool} />
          <Button label="恢复默认" onClick={resetPool} />
        </div>
        {editMsg ? <div style={smallLabel}>{editMsg}</div> : null}
      </Section>
    </Page>
  );
}
