import { Page, Section, Text, Button, Select, Segmented, useGrokTheme, useState, useEffect } from "../ui/canvas";
import type { ChangeEvent } from "../ui/canvas";

type SlotKey = "camera" | "pose" | "face" | "bottom" | "inner" | "shoe" | "palette" | "acc" | "scene" | "light";
type Vals = Record<SlotKey, string[]>;
type Locks = Record<SlotKey, boolean>;
type PoolKey = SlotKey | "pal0" | "pal1" | "pal2" | "pal3";
type Pools = Record<PoolKey, string[]>;
type Snap = { vals: Vals };
type SlotDef = { key: SlotKey; label: string; min: number; max: number; recent: number };
type ImgModel = "gpt" | "nano";
type Jacket = { name: string; word: string; hex: string; ink: string; kind: "collarless" | "hooded" };
type VidModel = "seedance" | "kling";
type MusicKey = "lyric" | "inst" | "none";
const VID_MODELS: { value: VidModel; label: string }[] = [
  { value: "seedance", label: "Seedance 2.0 Fast" },
  { value: "kling", label: "可灵 4.0" },
];
const MUSIC_OPTS: { value: MusicKey; label: string }[] = [
  { value: "lyric", label: "俏皮有歌词" },
  { value: "inst", label: "纯音乐" },
  { value: "none", label: "不附配乐" },
];
const MUSIC_TEXT: Record<MusicKey, string> = {
  lyric: "轻盈俏皮的儿童流行音乐，带简单可爱的歌词演唱，节奏自然",
  inst: "轻盈俏皮的纯音乐，木琴与尤克里里，节奏自然，无人声",
  none: "",
};
type ShotReq = { hat?: boolean; doll?: boolean; outdoor?: boolean; leaves?: boolean };
type ShotSet = { name: string; req: ShotReq; shots: string[] };
const SHOT_SETS: ShotSet[] = [
  { name: "踩落叶", req: { outdoor: true, leaves: true }, shots: ["从参考图姿态延续，她低头看脚下，轻轻踩一下地上的落叶，发丝微微晃", "她抬起头看向镜头后的家长，歪着头抿嘴笑，停顿一下", "她朝家长小步走近两步，停下时轻轻挥挥手，眼睛弯弯"] },
  { name: "拍手小跳", req: {}, shots: ["开场她双手轻轻拍两下，原地小跳一下，落地后看着镜头，衣摆轻轻弹起", "她停下来歪头，眼睛弯弯地微笑，不出声，碎发贴在脸颊", "家长逗她，她捂着嘴抿嘴笑，不出声，身体轻轻左右晃"] },
  { name: "抱玩偶转身", req: { doll: true }, shots: ["开场她把{玩偶}轻轻抱在身侧，看着镜头笑，{玩偶}不挡羽绒服门襟", "她带着{玩偶}慢慢转半圈，停下后把{玩偶}举高一点给家长看，开心地点点头", "她把{玩偶}收回身侧，歪头抿嘴笑，停顿一下"] },
  { name: "理帽子", req: { hat: true }, shots: ["开场她伸手{帽子动作}，露出眼睛，冲镜头笑", "她双手背在身后，原地轻轻转半圈又转回来，看向家长", "她停下踮踮脚，害羞地低头又抬头，嘴角带笑"] },
  { name: "蹲下看东西", req: {}, shots: ["从参考图姿态蹲下来，低头看脚边的地面，好奇地歪头", "她抬头看向家长，眼睛亮亮的，抿嘴笑，停顿一下", "她慢慢站起来，轻轻拍拍膝盖，朝镜头小步走近"] },
  { name: "拨碎发转圈", req: {}, shots: ["开场她伸手把额前碎发往耳后拨一拨，冲镜头笑", "她双手背在身后，原地轻轻转半圈又转回来，看向家长", "她停下踮踮脚，害羞地低头又抬头，嘴角带笑"] },
];
type HatType = "" | "cap" | "knit" | "beret" | "bucket" | "round";
type Feat = { hat: HatType; hatName: string; earmuff: boolean; scarf: boolean; bag: boolean; glasses: boolean; doll: boolean; dollName: string; outdoor: boolean; leaves: boolean };
function hatTypeOf(acc: string): HatType {
  if (/耳罩/.test(acc)) return "";
  if (/棒球帽/.test(acc)) return "cap";
  if (/贝雷/.test(acc)) return "beret";
  if (/渔夫帽/.test(acc)) return "bucket";
  if (/冷帽|针织帽|毛线帽/.test(acc)) return "knit";
  if (/帽/.test(acc)) return "round";
  return "";
}
const HAT_ACT: Record<string, string> = {
  cap: "轻轻压一压棒球帽的帽檐",
  knit: "把针织帽往下拉一拉",
  beret: "把贝雷帽扶正，往下理一理",
  bucket: "轻轻压一压渔夫帽的帽檐",
  round: "把毛绒帽往下拉一拉",
};
const OUTDOOR_SCENE = /小区|户外|公园|草坪|步道|街/;
const LEAF_SCENE = /落叶/;
function featuresOf(v: Vals): Feat {
  const acc = (v.acc[0] || "").replace(/^【玩偶】/, "");
  const scene = v.scene[0] || "";
  const accDoll = needsDoll(v.acc[0] || "");
  const doll = accDoll || needsDoll(v.pose[0] || "");
  const hat = hatTypeOf(acc);
  return {
    hat, hatName: hat ? acc.split("，")[0] : "",
    earmuff: /耳罩/.test(acc), scarf: /围巾/.test(acc), bag: /包/.test(acc), glasses: /眼镜/.test(acc),
    doll, dollName: doll ? (accDoll && acc.indexOf("泰迪熊") >= 0 ? "小泰迪熊" : "小毛绒玩偶") : "",
    outdoor: OUTDOOR_SCENE.test(scene), leaves: LEAF_SCENE.test(scene),
  };
}
function setFits(s: ShotSet, f: Feat): boolean {
  if (s.req.hat && !f.hat) return false;
  if (s.req.doll && !f.doll) return false;
  if (s.req.outdoor && !f.outdoor) return false;
  if (s.req.leaves && !f.leaves) return false;
  return true;
}
function shotPlan(idx: number, v: Vals): { name: string; shots: string[]; note: string } {
  const f = featuresOf(v);
  const want = SHOT_SETS[idx % SHOT_SETS.length];
  let pick: ShotSet;
  let note = "";
  if (f.doll) {
    pick = SHOT_SETS[2];
    if (want !== pick) note = "画面里有玩偶，镜头已自动换成「抱玩偶转身」";
  } else if (setFits(want, f)) {
    pick = want;
  } else {
    const ok = SHOT_SETS.filter((s) => setFits(s, f));
    pick = ok[idx % ok.length];
    const why = want.req.hat ? "画面没有帽子" : want.req.leaves ? "场景里没有落叶" : want.req.doll ? "画面没有玩偶" : "与画面不符";
    note = "原镜头「" + want.name + "」" + why + "，已自动换成「" + pick.name + "」";
  }
  const shots = pick.shots.map((s) => s.replace(/\{帽子动作\}/g, HAT_ACT[f.hat] || "").replace(/\{玩偶\}/g, f.dollName));
  return { name: pick.name, shots, note };
}
const LOGO_ORIENT =
  "Champion左胸草写标志（蓝字配红C）与左袖小C标的位置、朝向与参考图一致，字母与C标正向可读，不可左右镜像反转；若出现镜面反射，镜中倒影允许镜像，但人物实体服装上的标志必须保持正向";
const VID_BASE = "以参考图为视觉基础，生成一条9秒、720p、9:16竖屏短视频。保持小女孩的面容、发型、服装与原有场景一致。根据参考图姿态自然延伸动作，让她在原场景里轻松活动，与镜头后的家长自然互动，眼神、表情、发丝和衣摆随动作发生细微变化，可爱、松弛、有童真，不刻意摆拍或展示服装。开场即有自然动作，动作连贯，节奏轻快。镜头带轻微手持晃动，随人物小幅跟拍和调整构图，像家长随手记录的生活片段。沿用参考图的暖色环境光、光源方向与光影对比，肤色偏暖真实，不要改成惨白日光或阴天灰调，保留自然肤质、衣料褶皱和适度运动模糊，人物、手部与服装结构稳定。整体温馨、有亲近感。" + LOGO_ORIENT + "。";
const VID_AMB = "轻微环境声，如脚步声与羽绒服摩擦声";
const VID_NOVOICE = "小女孩全程不说话、不哼唱、不发出笑声、呼吸声、呢喃与任何人声，无对白、无旁白，笑容无声。";
function videoFor(m: VidModel, shots: string[], music: MusicKey): string {
  const mus = MUSIC_TEXT[music];
  if (m === "kling") {
    const n = shots.length;
    const marks = n === 4 ? [0, 2, 4, 7, 9] : n === 2 ? [0, 4, 9] : [0, 3, 6, 9];
    const timeline = shots.map((s, i) => marks[i] + "到" + marks[i + 1] + "秒：" + s + "。").join("\n");
    return [
      "【素材分工】\n@图片1作为首帧，提供小女孩的面容、发型、羽绒服与场景。",
      "【整体设定】\n" + VID_BASE + "无对白、无旁白、无字幕、无水印。",
      "【事件顺序】\n" + timeline,
      "【声音】\n" + (mus ? "仅配乐加" + VID_AMB + "。" + mus + "。" : "不附配乐，仅保留" + VID_AMB + "。") + VID_NOVOICE,
    ].join("\n\n");
  }
  const head = "将@图片1中的小女孩定义为女孩，@图片1同时作为场景与服装参考。" + VID_BASE.replace("以参考图为视觉基础，", "以@图片1为视觉基础，");
  const body = shots.map((s, i) => "镜头" + (i + 1) + "：" + s.replace(/她/g, "女孩") + "。").join("\n");
  const tail = (mus ? "（仅配乐加" + VID_AMB + "。" + mus + "）" : "（不附配乐，仅" + VID_AMB + "）") + "\n" + VID_NOVOICE + "无字幕、无水印。";
  return head + "\n" + body + "\n" + tail;
}

const SLOTS: SlotDef[] = [
  { key: "camera", label: "机位", min: 1, max: 1, recent: 2 },
  { key: "pose", label: "姿态与动作", min: 1, max: 1, recent: 3 },
  { key: "face", label: "孩子长相", min: 1, max: 1, recent: 4 },
  { key: "bottom", label: "下装", min: 1, max: 1, recent: 4 },
  { key: "inner", label: "内搭", min: 1, max: 1, recent: 2 },
  { key: "shoe", label: "鞋型", min: 1, max: 1, recent: 2 },
  { key: "palette", label: "配色方案", min: 1, max: 1, recent: 3 },
  { key: "acc", label: "小配饰", min: 1, max: 1, recent: 1 },
  { key: "scene", label: "场景", min: 1, max: 1, recent: 4 },
  { key: "light", label: "光线", min: 1, max: 1, recent: 2 },
];

const DEFAULT_POOLS: Pools = {
  camera: ["家长手机平视全身，构图微偏心", "家长手机微俯拍全身，透视自然", "齐胸高度略俯拍，孩子抬头看镜头", "略低于胸口平视全身，家长蹲着拍", "齐腰高度平视全身，构图略偏右", "门口玄关处家长站立平视全身，构图微偏左"],
  pose: ["轻轻蹦起，落地后双手自然张开，笑着看向镜头", "迈着轻快小步走向镜头，转头看向家长，神情俏皮", "【玩偶】单手侧拎着一个小毛绒玩偶，站定看向镜头，玩偶在身体侧边不遮挡羽绒服", "【玩偶】单手侧拎小毛绒玩偶，边走边看镜头，另一只手自然摆动", "蹲下拍拍鞋面，抬头看向镜头，嘴角带笑", "侧身站着轻轻挥手，看向镜头", "站定双手自然垂放，被家长叫住后转头笑", "探出半步，双手放在身侧，抬头看镜头", "蹲下看地面，抬头被家长叫住，笑着看镜头", "双手背在身后，身体微微前倾，探头看镜头", "踮起脚尖又轻轻落下，转头看镜头", "双手轻轻叉腰，身体微侧，歪头看镜头，嘴角带笑", "原地轻轻转一小圈，停下后面向镜头，碎发微动", "双手扶膝微微弯腰，抬头看镜头，眼睛弯弯", "侧身回头看镜头，碎发微动，抿嘴笑", "低头看看自己的鞋，再抬头看镜头笑，自然回应镜头后的家长"],
  face: ["5至7岁亚洲小女孩，圆润小脸，大眼睛带卧蚕，黑色短发配薄刘海，脸颊微圆，少量碎发", "5至7岁亚洲小女孩，偏圆小脸，杏眼，栗棕色双马尾，额前有碎发，肤质真实", "5至7岁亚洲小女孩，小巧鹅蛋脸，清澈圆眼，黑色马尾高扎，两侧有细碎鬓发", "5至7岁亚洲小女孩，圆脸，笑起来眼睛弯弯，浅棕色齐肩短发，自然碎发贴在脸颊", "5至7岁亚洲小女孩，软软圆脸，内双大眼，黑色半扎发，头顶有一个小抓夹", "5至7岁亚洲小女孩，幼圆脸，大而有神的眼睛，深棕色小波浪中短发，少量碎发", "5至7岁亚洲小女孩，圆脸带一点婴儿肥，卧蚕笑眼，黑色双辫，刘海轻薄", "5至7岁亚洲小女孩，小圆脸，单眼皮圆眼，亚麻茶棕色短发配空气刘海"],
  bottom: ["藏青色星星印花阔腿裤，裤长到鞋面", "藏青色宽松直筒运动裤", "深灰色阔腿卫裤，裤脚在鞋上微微堆一点", "灰色工装阔腿裤，裤侧一条深色条纹", "米白色宽松休闲裤，直筒到脚踝", "米白色儿童版型工装裤", "浅蓝色牛仔阔腿裤，裤脚盖住鞋面一点", "白色阔腿裤", "深灰色直筒牛仔裤", "米白坑条打底裤，一直套进靴口", "黑色直筒阔腿裤，裤脚盖住鞋面", "红黑格纹阔腿裤，九分到脚踝，裤脚微翻边", "深棕阔腿七分裤，裤脚宽卷边，里面深棕厚棉袜", "高腰灯芯绒A字中裙，裙长到膝盖，裙下加绒裤袜", "高腰针织中裙，裙长到膝盖，裙下米白加绒打底裤袜", "高腰针织中裙，裙长到膝盖，裙下浅灰加绒打底裤袜", "高腰牛仔中裙，裙长到膝盖，裙下加绒裤袜", "红黑格呢中裙，裙长到膝盖，裙下加绒打底裤袜", "焦糖格呢中裙，裙长到膝盖，裙下米白打底裤袜", "深灰毛呢中裙，裙长到膝盖，裙下加绒裤袜", "藏青灯芯绒中裙，裙长到膝盖，裙下浅灰加绒打底裤袜"],
  inner: ["藏青色高领打底衫，领口从无领短羽绒服里露出一截", "米白色圆领宽松卫衣，下摆盖住裤腰，不收腰", "芥末黄纯色长袖T恤，简单圆领", "浅粉色柔软长袖打底，袖口露在短羽绒外面", "灰色半拉链立领卫衣，拉链只拉到胸口", "深灰色小象卡通卫衣，落肩宽松，印花小而可爱", "牛仔蓝长袖衬衫，领子翻在外套外面", "米白卡通头像印花卫衣，衣身直筒", "细条纹长袖衬衫打底，只露出领口和袖口", "奶油色针织马甲，前面几个小黄水滴图案，穿在衬衫外面、羽绒服里面", "米白高领细针织，领口从无领短羽绒里露一截", "浅灰高领毛衣", "浅灰绿高领打底", "红色费尔岛提花圆领毛衣，胸前一圈白蓝绿几何", "合身大红圆领针织", "黑白宽条纹针织，仅外套敞开时露出"],
  shoe: ["黑色圆头儿童短靴，厚底", "黑色运动鞋，白鞋底", "白色低帮运动鞋，鞋面干净", "绿色儿童运动鞋", "红色低帮运动鞋", "黑色圆头校园鞋", "深色圆头儿童运动鞋", "焦糖翻毛雪地靴，靴口一圈奶油色毛", "棕色系带短靴，靴口白毛", "米色卷毛短靴", "棕色乐福鞋，鞋面一只小熊，袜口露米白"],
  palette: [],
  pal0: ["藏青与浅灰", "藏青与米白", "灰色与黑色", "浅粉与藏青", "奶油白与藏青", "藏青与芥末黄点缀", "米白与焦糖棕点缀", "酒红与米白点缀", "暖灰与藏青", "芥末黄点缀暖米白"],
  pal1: ["灰色与藏青", "藏青与白色", "灰色与米白", "藏青与浅灰", "白色与灰色", "藏青与黑色", "芥末黄与米白", "芥末黄与焦糖棕", "酒红与芥末黄点缀", "同色暖调延伸"],
  pal2: ["米白与灰色", "奶油白与芥末黄", "米白与白色", "芥末黄与米白", "白色与浅灰", "黑色与米白", "焦糖棕与米白", "酒红与黑色点缀", "藏青与米白", "暖灰与黑色"],
  pal3: ["藏青与浅灰", "藏青与米白", "灰色与黑色", "浅粉与藏青", "奶油白与藏青", "藏青与芥末黄点缀", "米白与焦糖棕点缀", "酒红与米白点缀", "暖灰与藏青", "芥末黄点缀暖米白"],
  acc: ["灰色针织冷帽", "条纹毛球针织帽", "粉色儿童棒球帽", "芥末黄针织冷帽，帽身有白色线条", "白色毛绒贝雷帽", "灰色毛绒耳罩", "米白色渔夫帽", "红蓝拼色棒球帽", "小白熊毛绒斜挎包，包带短", "不加配饰", "米白费尔岛毛线帽，帽顶棕色毛球", "米色毛绒圆帽", "棕色贝雷，帽顶一颗小毛球", "芥末黄厚围巾，松松绕一圈", "领口一枚棕绿格大蝴蝶结", "白色小花发夹", "圆框黑眼镜", "棕色毛边水桶包", "芥末黄小方包", "【玩偶】手里一只小号棕色泰迪熊"],
  light: ["落日低角度暖金色侧光，琥珀与焦糖色温，高饱和暖橙，光影对比清楚，发丝边缘带金边，肤色暖而真实，不是阴天也不是惨白日光", "傍晚夕阳的暖橙侧逆光，蜜糖色温，投影拉长偏暖棕，面部有来自地面的暖色反射光，暖色环境光", "暖黄午后斜射阳光，金色侧光从侧面落在孩子身上，光影分界清楚，阴影里透一点暖橙，色温偏焦糖", "秋日傍晚低角度金色阳光，暖色环境光，琥珀调，对比清楚，肤色与羽绒服颜色偏暖真实", "暖黄台灯与钨丝室内灯，暖橙光溢出到墙面与地板，蜜糖色温，光影有方向和层次，肤色偏暖不惨白", "傍晚暖窗光斜斜照进来，金黄侧光落在脸上与羽绒服，室内环境光偏琥珀，光影对比清楚", "客厅暖黄室内灯与落地窗余晖混合，焦糖色温，暖橙溢出，阴影柔和但仍有方向，整体温馨", "雾白奶油色调，偏奶油与蜜糖的柔雾暖白，阴影很浅，肤色白皙偏暖，轻微柔焦，不是冷白", "家长手机直闪抓拍，近亮远暗，画面带轻微颗粒与一点暖色溢出，生活感真实，像随手拍"],
  scene: [
    "明亮客厅，浅木地板浅景深虚化",
    "家中玄关，浅色墙面浅景深虚化",
    "小区银杏步道，浅灰石板路与金黄落叶浅景深虚化，无行人",
    "儿童房一角，浅色墙面浅景深虚化",
    "明亮客厅落地窗前，纱帘浅景深虚化",
    "家中玄关换鞋处，浅灰地砖浅景深虚化",
    "小区步道旁草坪转角，浅灰石板路浅景深虚化，无车辆",
    "儿童房床边，浅色床单浅景深虚化",
    "客厅一角，中性留白浅景深虚化",
    "家中阳台门内侧，玻璃门浅景深虚化",
    "小区落叶草坪，金黄落叶浅景深虚化，无行人",
    "公园步道，浅色步道与金黄落叶浅景深虚化，无行人",
  ],
};

const JACKETS: Jacket[] = [
  { name: "米白", word: "米白色", hex: "#F1EBDD", ink: "#222222", kind: "collarless" },
  { name: "芥末黄", word: "芥末黄色", hex: "#D8A826", ink: "#222222", kind: "collarless" },
  { name: "黑色", word: "黑色", hex: "#1D1D1F", ink: "#FFFFFF", kind: "collarless" },
  { name: "米白连帽", word: "米白色", hex: "#F1EBDD", ink: "#222222", kind: "hooded" },
];
const JACKET_IMG: string[] = ["data:image/jpeg;base64,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", "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAwICQsJCAwLCgsODQwOEh4UEhEREiUbHBYeLCcuLisnKyoxN0Y7MTRCNCorPVM+QkhKTk9OLztWXFVMW0ZNTkv/2wBDAQ0ODhIQEiQUFCRLMisyS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0v/wAARCADIAMgDASIAAhEBAxEB/8QAGwABAAMBAQEBAAAAAAAAAAAAAAMEBQIGAQf/xAA9EAABBAAEAgcGBQEHBQAAAAABAAIDEQQSITEFQRMiMlFhcYEGFEKRkrEjU6HB0fAkUmJyouHxMzREY4L/xAAaAQEAAwEBAQAAAAAAAAAAAAAAAQIEAwUG/8QAJhEBAAICAQQCAgIDAAAAAAAAAAECAxEEEiExURNBFGEVMgVxsf/aAAwDAQACEQMRAD8A/SERFCRERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERARQ4jFQ4YXK8A925PosvFcXke38AdG29zq4rPl5GPF/ae60UmW0i8pwniOLDpmdOXGOQgtk1G61m8Xe3/AKmHB8WvXKvNxT57LTjtDVRURxB5/wDFk+oKCTjD9QzDgEadZ38LtfkY6Ru3/JVisz4aqLzmKx2JlAzTFou6ZoFYwfFpWNaMQOlH94dpcK87FNtT2WnFOm2ihw+KhxI/CeCebToR6KZbK2i0biXOY0IiKwIiICIiAiIgIiICIiAiLmR7Y2Oe801oslRM67yOMRiI8MzNK6r2A3KyMTxWWQ1HUbPA6/NVcdiXYmZzn6AbDu8FEWXmC8XPzL3nVJ1DRXHEeXbuuSeZ3J3UbxTXDw0PipWNXLmFz6WJ0ZjXOw/G62jxEeb1GhWsJGZhzCrYrC9I1uuVzTbHdxUMGJdG/o8Q2idP+FbfiRvCaLpszXjLd9Vp+yoEZQS7ckn9VwJMlEEFh5rrESNdF1SCVp5HKtniItEdlKUivhUE3TyPY34CAT4lTZTm00XGFhEQ0s3qSdye9Wi21kXVnOcHWNCNiNwr+F4xPF1ZvxWjv0d81UMdlQhzRiix+gLbB+dq+PJfHO6zomIny9VhcVFio88TrHMHceamXkOF418b2YiPZ3w/3mr1sb2yMa9htrhYXt8bkfNGp8wzXp0y6REWpQREQEREBERAREQFmccxIiijiuukcL8lprzXFXDGCRw2sFvpssXNydGPXt0xxuVd7SS0DXNuO5TxspotZ0MrxxDDwu1Dg51+Q/3WuSG1a8XTRLnKQNlCx7ulOlUFazArgsFkhTr0hwZHVrqPJQzRtfCXFrXAa1WisEUFVfJTHMOhdRa4fEL1BQUo2ZXyhjnFo+EmwD4LRZAGgWcx+yrRMLIGkmx2hp3rQqxaSlG1uqkFA0V8LTWm6rHpDIAVHgWure6q4mKgZK2BtdguHIKSukheD5EJ5GVwFxfgzn7Qe5vovTcFntj4HHVnWb5c15TgpMRfEeTyf2WxhMQYcWyUdm6PktGHJ8ebq+kXruHpkRF77IIiICIiAiIgIiIK3EZeiwr6NOf1QsOvwyFocUlzzhgOjB+pVFwthpeHzMnXlmPTRjjUMsMv2gwoGzIXuPqQFqzCyFj4WcS8djcCABh3tLedhw/lbZeHDais0+Ih0lDr3o273KkpAK1UaQ6AzNLVlSvuURnR4eCW+u4WkyTrmgq2OgD5IZB8LxRpSOn0MI3wYrD5Msbd9aVeUf2Zo/w9ylnFs37I/VQOzKSeq0keS+DrOsscD5IC5oGg05r6JCbFgGu5SOX6CwDY8FwyVheWg7jS1I7MauvkqMweyZmwOarHioGfhgRjp2jS3la2Ut05clkYKRp4g/MaLmXr3kWtoOD2muWiW8rS3OGT9NhG2eszqlW1hcGn6PGOiJ0lGnmP6K3V7vFyfJiifTLeNWERFpUEREBERAXx7gxjnO2aLK+qnxSTLhsg3ea9Fzy3+Ok29JiNzpkSSGR7nHUuNlRuzVofJSBq+uoBfOT37y1PO8Jhv2lxsrT1RCPmTqvRBhzX3LM4PDl4jjX1uWi/mVsHRdLd5TPlxSjc4uOUctyprFFRBhG/NVQ+NGwA0SXs69+/I/7ruqadaUT32LurIuu9QIX2G3Z7OuulUp3ytMR0oBpKS/8AbN8qX3EADDEju3QSN7I8lyRrYXbR1QuSN1YRglmlEt+yhxAbI+MC+2FYINWFFN2oz/jH3UDzuJLouOYdjfiAF92p/ZehgZUbidzqsTiLa49gnVu4j5f8lb9ZYj4Kbd9f6SqCcxYprmnrNNj0Xro3iSNr29lwBC8RGDNjHOGzNPVeq4NMJMKWc4zVeB2W3gX6bzSftyyx22voiL13AREQEREBZPEpM+JLeTBXqtSR4jY57tmiyvOGfO8uduTZXnc/JqsU9uuKO+3bnBoLjsBqqj8S15OVwNdyshwcK71jTsfhnFlBzQdPDmvJ8u8NDhVF07hzkP2CvuFtJWRwJx90c93xSOWpHbib5K/jsifL6BRAC7I1X2u9RSShpARDtzbaQOaqCMtcQ5oI0o9ynEju4rlxz6nSuXeqyl8ez8BpvQNOi+4mzhR5BHFzoTVUBWp5r4GmSFjeQAJHfop0JozoPILvOzK1pbdA63ROv9BVWteTRe4EaL50T/75tWi8xGoNLBdEPgN/5lWxLm5mECgHC7N818MTgQTI6r/RJISY3NLia8PG1HVMmmLxGRo43ww/+0j5tI+69C8HoXaa0vPY3D5OK4N9A/iNaCPut+aTK6gltahKhgY8kJJ7RJJ81pcIn6LHhhPVlGX13CqtYW3puSq8spikY9vaaQ4einHfovFkTG409mi4ikbNEyRvZe0OHqu19FE7ZBERSCIiClxaXo8LQ3eQPTmsfKDyV7i7y+cMGzG/qqg0Xh8u/Xln9dmikaqiLCCC3RVsY3MXHnsfMa/Yq+DzWTj8SIZZ2nua8fKisuvTrCXh7cmDiaBu5x/1FabAGN8Tqs3gz+kwOHkdqS0/cq+9+inxMolJnQMDnA1tzVdmY8vmpWFwIsaJEoSZFDOclNs2SNtVZtVcU4h7QKs1fgFNvCBrRkBrXLvS6w4IiYQSQQF2wAQ+i5gOWFmvVI+ShLtzeY35KGaTJ6bKUvUUjRIkiPpT3FdNfm5UQF9La1XTSANFAxONu6N0EvJkzD/qC2ARbn7k6BZPHmh2FfpZGqu8PlM+Qvrs2KU/ULfSw4FsWvIFZeLkyvynda846tLKlhDp3Od5BR9kPR+zWJ6fh2QnrQuLfTcLWXnPZ2URYx0Wwkb+o/or0a93i368UfplyRqwiItKgiKvj5Oiwcz7o5aHmdFW1ums2n6IjcsSWbppZH32nE+ijfIWk3z2UAzE9VduY6RtG9CvmpmZnctj6yY3Wqw+Oi8QM2jQx23MAX+y3CDkF2TzWbxloIikGpH6hWpOrJhb4ZlZg4A3siMV8ldYQTrsqWEicYYw0U0CgrXQyN2Kr32iVtpDhshIUbLEYvdfHFW2h2ZKVLGF73tIflY1wJA3cvr3uklDGeqYthYxtjUOH3UbmUrAd+FRrmo2FxwrMu9L5kDmhxdQH8phnAwtvQa/dEO+jfW6NjkzDZTtda5LwCp1AjdoSCq0knR2pppKKz8cC+M0SLCrtMKnE5DJhJXDXKFL7LF0uCZO74m0PJR4lgGBnHe2x8locBgEHDMMxvKJv2V9x06/aVnFuy0s97gT4q3iInzTkHRoaNBzK5EOXZoCpIjgkdh54cQAaa4E/uvZeWy8didIi3Zem4VP7xw7DyHfJR8xp+y9P/H381ccseJW0RF6jgLP4y7+zsZfadr6LQWRxmQDERsN6MJ/VZeXbpwyvSN2UKDRoFIBraruxAstayRx/wAtD5lGyO+IjyHJeFvTTp1iZWRNGYgKg7Du4pKzCxOy5rJcPhbzKlxrc4zk6i68Fsez3D/dcE+eQVLM0keDeXz3Wjj4vlvH6Ra3TG2ZhZRkaBsBStCa2+azYOrGPFWGu00WaJTpazKOYvJDWDdV+lJJPipmP2PcmzSWGMQt73ncqpj5KMbnAHrga8lZL+azeJzGgALGYVW92rb3OiIacYZ0YLxdWuIImviBBI3+64a/qO15phnjoh3An7qNicvqh81DLKRWvNcySdcG99CquNLs0dGhnpx7rFKPI6e90riGWVLPHUTSautV11MPH1e0oZZLZ4IlQxT6ie07EUtrDxOwQOFkv8IANcfibWhWDijmjvusL2nFcIZ8IySOhJG0X4trVaseKb47THmFbW1MQyzK0G7F964dK15Fa66rluHHi7xKlbGGi9LGyzJVMYKDhvS1fZOfpMFLH+XJp5EfyCsjFyUXgakDVWfYsyRzYqKZ7XZuszKKpo5fqt3B1172pk/q9UiIvZZhef4+90ONjfWjmAD56r0CrY3AQY5obM0mtiDss/JxTlx9MLUt0zt5rDOEkbnud17ObuBHL0UjgHNB0I5KxN7OyRF7sLIHhxJLHaWTX8KnBw3iDpehdEWvddyO7LQvGtx8tZ1MNPVWe+1jA4P3ycMOsTTmf5d3qvTVYrlsq+BwjMFAI2HMd3OO7irC9jjYPipqfMs97dUvESv6MubzDsv6p7xTTe4Fr2Rw8DiSYYyTuS0J7rB+TH9IWP8Aj59unzR6eP6UCQNa4ZXWSe5didtCnCz47L1vuuH/ACI/oC+e6Yf8iL6An8fPs+WPTynTNeSA4U3c2oJZGF9B3fbmiz6eK9kcJhjvh4voCDCYcbQRD/4CfgT7Plj08e2WRzRlGUHXrcj3KSOSszXuF3YI52vWe64f8iL6AvvuuH/Ij+gKP4+3s+WPTxpeS/UgtvvXMzxIxwBGYcjz5he091w/5Ef0BPdcP+RH9IU/gW9nzR6eNdKJA2jodRfKlESTfc4n0/ql7b3XD/kR/QE90w/5EX0BPwLez5o9PCOYXymMAdZwA9dP4X6ABQA7hSjbhcO0gtgjBGxDApVr4+CcO9z5c736nneIRuweIc0A9G7rMPh3KmcQHEgHUL02NwrMZAY3Gju13cV5aXg2ObiiwNJrZzRYIXncni2pfdY7S7UvEx3UMQ97Z5Gt7LjmFc+8LU9lbk4pPJGCImsO/jX72p4PZqSQ5sTNVm6GpWzw/huH4c1wgBtwoknddeNx7xeLWjUIvkjWoXERF6zOIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiD/2Q==", "data:image/jpeg;base64,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", "data:image/jpeg;base64,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"];
const PAGE_VER = "v12 · 2026-11-03";
const POOL_KEY = "kr-kid-down-pools-v9";
const POOL_LEGACY = ["kr-kid-down-pools-v8", "kr-kid-down-pools-v7", "kr-kid-down-pools-v6", "kr-kid-down-pools-v5", "kr-kid-down-pools-v4", "kr-kid-down-pools-v3"];
const POOL_RESET_ON_MIGRATE: PoolKey[] = ["bottom"];
const HIST_KEY = "kr-kid-down-history-v1";
const PREF_KEY = "kr-kid-down-prefs-v1";
const memStore: Record<string, string> = {};
const IMG_MODELS: { value: ImgModel; label: string }[] = [
  { value: "gpt", label: "GPT Image 2" },
  { value: "nano", label: "Nano Banana" },
];
const NO_LOCKS: Locks = { camera: false, pose: false, face: false, bottom: false, inner: false, shoe: false, palette: false, acc: false, scene: false, light: false };
const POOL_KEYS: PoolKey[] = ["camera", "pose", "face", "bottom", "inner", "shoe", "palette", "acc", "scene", "light", "pal0", "pal1", "pal2", "pal3"];
const EDIT_KEYS: { key: PoolKey; label: string }[] = [
  { key: "pose", label: "姿态与动作（需要玩偶的条目以【玩偶】开头，不写具体地点）" },
  { key: "face", label: "孩子长相" },
  { key: "bottom", label: "下装" },
  { key: "inner", label: "内搭" },
  { key: "shoe", label: "鞋型" },
  { key: "pal0", label: "搭配色（米白羽绒服，只写颜色气氛，勿写具体衣服）" },
  { key: "pal1", label: "搭配色（芥末黄羽绒服，只写颜色气氛，勿写具体衣服）" },
  { key: "pal2", label: "搭配色（黑色羽绒服，只写颜色气氛，勿写具体衣服）" },
  { key: "pal3", label: "搭配色（米白连帽羽绒服，只写颜色气氛，勿写具体衣服）" },
  { key: "acc", label: "小配饰（可写「不加配饰」）" },
  { key: "scene", label: "场景" },
  { key: "light", label: "光线" },
  { key: "camera", label: "机位" },
];

function readStore(k: string): string | null {
  try { const v = window.localStorage.getItem(k); if (v !== null) return v; } catch (e) {}
  return memStore[k] !== undefined ? memStore[k] : null;
}
function writeStore(k: string, v: string): void {
  memStore[k] = v;
  try { window.localStorage.setItem(k, v); } catch (e) {}
}
function rnd(n: number): number { return Math.floor(Math.random() * n); }
function pickOne(pool: string[], recent: string[], n: number): string {
  if (pool.length === 0) return "";
  for (let k = Math.min(n, recent.length); k >= 0; k--) {
    const ban = recent.slice(0, k);
    const c = pool.filter((x) => ban.indexOf(x) < 0);
    if (c.length > 0) return c[rnd(c.length)];
  }
  return pool[rnd(pool.length)];
}
function drawSlot(def: SlotDef, pools: Pools, history: Snap[], jacket: number): string[] {
  const pool = def.key === "palette" ? pools[("pal" + jacket) as PoolKey] : pools[def.key];
  const recent = history.map((h) => (h.vals[def.key] || [])[0] || "");
  return [pickOne(pool, recent, def.recent)];
}
const INDOOR_LIGHT = /窗|室内灯|落地窗/;
const BANNED = /黑丝|丝袜|项链|耳环|手链|戒指|首饰/;
function lightFits(light: string, scene: string): boolean {
  return !(OUTDOOR_SCENE.test(scene) && INDOOR_LIGHT.test(light));
}
function needsDoll(text: string): boolean {
  return /【玩偶】/.test(text) || text.indexOf("泰迪熊") >= 0 || (text.indexOf("小毛绒玩偶") >= 0 && text.indexOf("拎") >= 0);
}
function drawAll(pools: Pools, cur: Vals | null, locks: Locks, history: Snap[], jacket: number): Vals {
  const out = {} as Vals;
  const safe = { ...pools } as Pools;
  for (const k of POOL_KEYS) { const c = pools[k].filter((x) => !BANNED.test(x)); if (c.length > 0) safe[k] = c; }
  for (const def of SLOTS) {
    if (cur && locks[def.key] && cur[def.key] && cur[def.key].length > 0) out[def.key] = cur[def.key];
    else out[def.key] = drawSlot(def, safe, history, jacket);
  }
  const recentOf = (k: SlotKey) => history.map((h) => (h.vals[k] || [])[0] || "");
  const fix = (k: SlotKey, bad: (x: string) => boolean, src: string[], n: number) => {
    if (locks[k] || !bad(out[k][0] || "")) return;
    const c = src.filter((x) => !bad(x));
    if (c.length > 0) out[k] = [pickOne(c, recentOf(k), n)];
  };
  if (!lightFits(out.light[0] || "", out.scene[0] || "")) {
    if (!locks.light) fix("light", (x) => !lightFits(x, out.scene[0] || ""), safe.light, 2);
    else if (!locks.scene) fix("scene", (x) => !lightFits(out.light[0] || "", x), safe.scene, 4);
  }
  const isBoot = (x: string) => /靴/.test(x);
  if (/坑条打底裤|套进靴口/.test(out.bottom[0] || "") && !isBoot(out.shoe[0] || "")) {
    if (!locks.shoe) fix("shoe", (x) => !isBoot(x), safe.shoe, 2);
    else if (!locks.bottom) fix("bottom", (x) => /坑条打底裤|套进靴口/.test(x), safe.bottom, 4);
  }
  if (/厚棉袜/.test(out.bottom[0] || "") && /袜口/.test(out.shoe[0] || "")) {
    if (!locks.shoe) fix("shoe", (x) => /袜口/.test(x), safe.shoe, 2);
    else if (!locks.bottom) fix("bottom", (x) => /厚棉袜/.test(x), safe.bottom, 4);
  }
  if (needsDoll(out.pose[0] || "") && needsDoll(out.acc[0] || "")) {
    if (!locks.acc) fix("acc", (x) => needsDoll(x), safe.acc, 1);
    else if (!locks.pose) fix("pose", (x) => needsDoll(x), safe.pose, 3);
  }
  if (jacket === 2) {
    fix("inner", (x) => /黑白宽条纹|浅粉/.test(x), safe.inner, 2);
    fix("acc", (x) => /粉色|浅粉/.test(x), safe.acc, 1);
    fix("palette", (x) => /浅粉/.test(x), safe.pal2, 3);
  }
  return out;
}
function poseDisplay(raw: string): string { return raw.replace(/^【玩偶】/, "").trim(); }
function chipText(key: SlotKey, v: string[]): string {
  const s = v.join("、");
  if (key === "pose") return poseDisplay(v[0] || "").split("，")[0];
  if (key === "face") return "长相：" + (v[0] || "").replace(/^5至7岁亚洲小女孩，/, "").split("，")[0];
  if (key === "scene") return (v[0] || "").split("，")[0];
  if (key === "light") return "光线：" + (v[0] || "").split("，")[0];
  if (key === "bottom") return s.split("，")[0];
  if (key === "acc") {
    if (s === "无额外配饰" || s === "不加配饰") return "无配饰";
    return s.replace(/^【玩偶】/, "").split("，")[0];
  }
  return s;
}
function isSkirt(bottom: string): boolean { return bottom.indexOf("裙") >= 0; }
const PALETTE_GARMENT = /毛衣|卫衣|针织|裤|靴|鞋|帽|围巾|贝雷|乐福|打底|高领|衬衫|费尔岛|坑条|格纹|马甲|包|袜/;
function paletteTone(raw: string): string {
  const s = (raw || "").trim();
  if (!s || PALETTE_GARMENT.test(s)) return "中性暖色点缀";
  return s;
}
function buildCore(v: Vals, jacket: number, faceRef: boolean) {
  const J = JACKETS[jacket] || JACKETS[0];
  const poseRaw = v.pose[0] || "";
  const pose = poseDisplay(poseRaw);
  const acc0 = (v.acc[0] || "").trim();
  const doll = featuresOf(v).doll;
  const bottom = v.bottom[0] || "";
  const skirt = isSkirt(bottom);
  const accClean = acc0.replace(/^【玩偶】/, "").trim();
  const accIsDoll = needsDoll(acc0);
  const accText = !accClean || accClean === "无额外配饰" || accClean === "不加配饰" || accIsDoll ? "" : "；配饰：" + accClean;
  const dollText = doll
    ? (accIsDoll && accClean.indexOf("泰迪熊") >= 0
      ? "手里抱着一只小号棕色泰迪熊，放在身体侧边，不遮挡羽绒服门襟与标志。"
      : "一只手侧拎小毛绒玩偶，玩偶放在身体侧边，不遮挡羽绒服门襟与标志。")
    : "";
  const faceText = faceRef
    ? "保留图3五官与发型特征，幼童比例自然，脸颊微圆，肤质真实，带少量碎发"
    : (v.face[0] || "5至7岁亚洲小女孩，幼童比例自然，脸颊微圆，肤质真实，带少量碎发");
  const leg = skirt && !/裤袜|打底/.test(bottom) ? "，裙下加绒裤袜，哑光有皮肤纹理" : "";
  const outfit = "内搭：" + (v.inner[0] || "") + "；下装为" + bottom + leg + "；脚穿" + (v.shoe[0] || "") + accText + "。尺码合身略宽松，褶皱自然。配色以" + J.word + "羽绒服为主，色调" + paletteTone(v.palette[0] || "") + "，不要另加其他衣服款式。";
  const occ = "不被手臂" + (doll ? "、玩偶" : "") + (accText ? "或配饰" : "") + "遮挡。";
  const jacketLine = J.kind === "hooded"
    ? ("按图1正面、图2背面严格还原" + J.word + "Champion连帽短款羽绒服的廓形、面料、颜色、图案、缝线及标识位置；连帽，同色拉链门襟，左胸Champion草写标志（蓝字配红C），左袖小C标，横向规则绗缝格；帽子可自然戴在头上或垂在背后。还原版型、衣长与蓬松度，不添加设计、文字或标志。拉链门襟与左胸标志始终清晰可见，" + occ + LOGO_ORIENT + "。")
    : ("按图1正面、图2背面严格还原" + J.word + "Champion无领短款羽绒服的廓形、面料、颜色、图案、缝线及标识位置；自然穿着，同色按扣门襟，左胸贴袋带Champion草写标志，左袖小C标，面料为不规则压胶绗缝；还原版型、衣长与蓬松度，不添加设计、文字或标志。门襟与左胸贴袋始终清晰可见，" + occ + LOGO_ORIENT + "。");
  const visNote = J.kind === "hooded" ? "拉链门襟与左胸标志清晰可见不被遮挡" : "门襟与左胸贴袋清晰可见不被遮挡";
  return {
    camera: v.camera[0] || "家长手机平视全身，构图微偏心",
    pose: pose + "。自然回应镜头后的家长，神情俏皮生动，不刻意摆拍。" + dollText,
    face: faceText, jacketLine, outfit,
    scene: (v.scene[0] || "") + "。无人群、无可读文字、无积木拼图等复杂装饰。背景简洁虚化不抢主体，主体羽绒服清晰锐利，背景色偏中性低对比。",
    light: (v.light[0] || "") + "。暖色环境光为主，光影对比清楚，面部和服装清晰，发梢与手脚可有轻微动态模糊，整体温馨、鲜活、有童真。不要惨白日光、不要阴天灰调、不要过曝发白。",
    constraints: ["服装还原优先，严格按参考图", visNote, LOGO_ORIENT, "幼童比例，不写成成人身材", "背景简洁虚化不抢主体，主体羽绒服清晰锐利，背景色偏中性低对比", "无积木拼图等复杂装饰", doll ? "玩偶在身体侧边不遮挡服装" : "主体是孩子与羽绒服"],
  };
}
function imageFor(m: ImgModel, v: Vals, jacket: number, faceRef: boolean): string {
  const c = buildCore(v, jacket, faceRef);
  if (m === "nano") {
    return "参考上传的服装图，生成一张9:16竖版儿童日常抓拍照。一名" + c.face + "，穿着图1正面、图2背面里的羽绒服：" + c.jacketLine + "穿搭是" + c.outfit + "她正在" + c.pose + "她身处" + c.scene + "机位是" + c.camera + "，全身入画，头顶与鞋履完整入镜，透视自然，背景浅景深虚化不抢主体。光影上，" + c.light + "皮肤有真实纹理，羽绒服绗缝清晰可见，像家长手机随手拍的原片。";
  }
  return [
    "用途：参考上传的服装图，生成一张9:16竖版儿童日常抓拍照。服装还原优先。家长手机抓拍视角，单人全身，头顶与鞋履完整入镜。",
    "背景：" + c.scene,
    "人物：" + c.face + "。姿态：" + c.pose + "机位：" + c.camera + "。",
    "羽绒服：" + c.jacketLine,
    "穿搭：" + c.outfit,
    "光影：" + c.light,
    "质感：手机抓拍原片，暖色环境光，肤色偏暖真实；保留皮肤纹理与羽绒服绗缝细节；不磨皮、不过度锐化，无美颜滤镜感，不要惨白过曝。",
    "约束：" + c.constraints.join("；") + "。",
  ].join("\n");
}
function loadPools(): Pools {
  const out = {} as Pools;
  let saved: Record<string, unknown> = {};
  let fromLegacy = false;
  try {
    let raw = readStore(POOL_KEY);
    if (!raw) {
      for (let i = 0; i < POOL_LEGACY.length; i++) {
        raw = readStore(POOL_LEGACY[i]);
        if (raw) { fromLegacy = true; break; }
      }
    }
    if (raw) saved = JSON.parse(raw);
  } catch (e) {}
  for (const k of POOL_KEYS) {
    if (fromLegacy && POOL_RESET_ON_MIGRATE.indexOf(k) >= 0) { out[k] = DEFAULT_POOLS[k].slice(); continue; }
    const s = saved[k];
    if (Array.isArray(s) && s.length > 0 && s.every((x) => typeof x === "string")) out[k] = s as string[];
    else out[k] = DEFAULT_POOLS[k].slice();
  }
  if (fromLegacy) writeStore(POOL_KEY, JSON.stringify(out));
  return out;
}
function loadHistory(): Snap[] {
  try {
    const raw = readStore(HIST_KEY); if (!raw) return [];
    const arr = JSON.parse(raw); if (!Array.isArray(arr)) return [];
    return arr.filter((h) => h && h.vals && SLOTS.every((d) => Array.isArray(h.vals[d.key]))).slice(0, 5) as Snap[];
  } catch (e) { return []; }
}
function loadPrefs(): { jacket: number; faceRef: boolean; imgModel: ImgModel; vidModel: VidModel; music: MusicKey } {
  try {
    const raw = readStore(PREF_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      const j = typeof p.jacket === "number" && p.jacket >= 0 && p.jacket < JACKETS.length ? p.jacket : 0;
      const mu: MusicKey = p.music === "inst" || p.music === "none" ? p.music : "lyric";
      return { jacket: j, faceRef: p.faceRef === true, imgModel: p.imgModel === "nano" ? "nano" : "gpt", vidModel: p.vidModel === "kling" ? "kling" : "seedance", music: mu };
    }
  } catch (e) {}
  return { jacket: 0, faceRef: false, imgModel: "gpt", vidModel: "seedance", music: "lyric" };
}
async function copyText(text: string): Promise<boolean> {
  try { if (navigator.clipboard && navigator.clipboard.writeText) { await navigator.clipboard.writeText(text); return true; } } catch (e) {}
  try {
    const ta = document.createElement("textarea");
    ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    const ok = document.execCommand("copy"); document.body.removeChild(ta); return ok;
  } catch (e) { return false; }
}
type Init = { pools: Pools; vals: Vals; history: Snap[]; jacket: number; faceRef: boolean; imgModel: ImgModel };
function makeInit(): Init {
  const pools = loadPools(); const hist = loadHistory(); const prefs = loadPrefs();
  const vals = drawAll(pools, null, NO_LOCKS, hist, prefs.jacket);
  return { pools, vals, history: [{ vals } as Snap].concat(hist).slice(0, 5), jacket: prefs.jacket, faceRef: prefs.faceRef, imgModel: prefs.imgModel };
}
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
  const [history, setHistory] = useState<Snap[]>(init.history);
  const [locks, setLocks] = useState<Locks>(NO_LOCKS);
  const [jacket, setJacket] = useState<number>(init.jacket);
  const [faceRef, setFaceRef] = useState<boolean>(init.faceRef);
  const [imgModel, setImgModel] = useState<ImgModel>(init.imgModel);
  const [vidModel, setVidModel] = useState<VidModel>(() => loadPrefs().vidModel);
  const [music, setMusic] = useState<MusicKey>(() => loadPrefs().music);
  const [musicLock, setMusicLock] = useState<boolean>(false);
  const [shotIdx, setShotIdx] = useState<number>(() => rnd(SHOT_SETS.length));
  const [copied, setCopied] = useState<string>("");
  const [editKey, setEditKey] = useState<PoolKey>("bottom");
  const [editText, setEditText] = useState<string>(init.pools.bottom.join("\n"));
  const [editMsg, setEditMsg] = useState<string>("");
  useEffect(() => { writeStore(HIST_KEY, JSON.stringify(history)); }, [history]);
  useEffect(() => { writeStore(PREF_KEY, JSON.stringify({ jacket, faceRef, imgModel, vidModel, music })); }, [jacket, faceRef, imgModel, vidModel, music]);
  const imageText = imageFor(imgModel, vals, jacket, faceRef);
  const plan = shotPlan(shotIdx, vals);
  const videoText = videoFor(vidModel, plan.shots, music);
  const vidName = vidModel === "kling" ? "可灵 4.0" : "Seedance 2.0 Fast";
  const imgName = imgModel === "nano" ? "Nano Banana" : "GPT Image 2";
  const doDraw = () => {
    const nv = drawAll(pools, vals, locks, history, jacket);
    setVals(nv); setHistory([{ vals: nv } as Snap].concat(history).slice(0, 5)); setCopied("");
    setShotIdx((shotIdx + 1 + rnd(SHOT_SETS.length - 1)) % SHOT_SETS.length);
    if (!musicLock) {
      const opts = MUSIC_OPTS.map((o) => o.value);
      const pool = opts.length > 1 ? opts.filter((x) => x !== music) : opts;
      setMusic(pool[rnd(pool.length)]);
    }
  };
  const chooseJacket = (j: number) => {
    if (j === jacket) return;
    const palDef = SLOTS.filter((d) => d.key === "palette")[0];
    const nv: Vals = { ...vals, palette: drawSlot(palDef, pools, history, j) };
    setJacket(j); setVals(nv); setLocks({ ...locks, palette: false });
    setHistory([{ vals: nv } as Snap].concat(history.slice(1))); setCopied("");
  };
  const lockCount = SLOTS.filter((d) => locks[d.key]).length + (musicLock ? 1 : 0);
  const unlockAll = () => { setLocks(NO_LOCKS); setMusicLock(false); };
  const doCopy = async (which: string, text: string) => { setCopied((await copyText(text)) ? which : "fail"); };
  const chooseEdit = (k: string) => { const key = k as PoolKey; setEditKey(key); setEditText(pools[key].join("\n")); setEditMsg(""); };
  const savePool = () => {
    const lines = editText.split("\n").map((x) => x.trim()).filter((x) => x.length > 0);
    const uniq = lines.filter((x, i) => lines.indexOf(x) === i);
    if (uniq.length === 0) { setEditMsg("至少保留一行。"); return; }
    const np: Pools = { ...pools, [editKey]: uniq };
    setPools(np); writeStore(POOL_KEY, JSON.stringify(np)); setEditText(uniq.join("\n")); setEditMsg("已保存，共 " + uniq.length + " 项，下次换一组生效。");
  };
  const resetPool = () => {
    const d = DEFAULT_POOLS[editKey].slice();
    const np: Pools = { ...pools, [editKey]: d };
    setPools(np); writeStore(POOL_KEY, JSON.stringify(np)); setEditText(d.join("\n")); setEditMsg("已恢复默认。");
  };
  const boxStyle = { border: "1px solid " + theme.border.default, borderRadius: theme.radius.lg, padding: 16, whiteSpace: "pre-wrap" as const, overflowWrap: "anywhere" as const, userSelect: "text" as const, color: theme.text.primary, fontFamily: theme.font.family, fontSize: theme.font.body2.fontSize, lineHeight: theme.font.body2.lineHeight };
  const smallLabel = { fontFamily: theme.font.family, fontSize: theme.font.label.fontSize, lineHeight: theme.font.label.lineHeight, color: theme.text.tertiary };
  const chipBase = { display: "inline-flex", alignItems: "center", gap: 6, maxWidth: "100%", padding: "6px 12px", borderRadius: theme.radius.full, fontFamily: theme.font.family, fontSize: theme.font.label.fontSize, lineHeight: theme.font.label.lineHeight, color: theme.text.primary, textAlign: "left" as const, cursor: "pointer" };
  const copyLabel = (which: string, base: string) => (copied === which ? "已复制" : base);
  const refLine = faceRef ? "上传顺序：图1 衣服正面，图2 衣服背面，图3 脸参考图。" : "上传顺序：图1 衣服正面，图2 衣服背面。";
  return (
    <Page title="韩系羽绒服日常抓拍 · 儿童提示词抽卡器" summary={PAGE_VER + "。先选颜色，再抽选项，最后复制生图与视频提示词。"} lang="zh-Hans">
      <Section heading="第一步：选羽绒服颜色">
        <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 12 }}>
          {JACKETS.map((j, i) => {
            const on = i === jacket;
            return (
              <button key={j.name} onClick={() => chooseJacket(i)} aria-pressed={on} style={{ flex: "1 1 90px", maxWidth: 180, display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 6, padding: 6, background: on ? theme.fill.secondary : "transparent", color: theme.text.primary, border: "1px solid " + (on ? theme.border.strong : theme.border.default), outline: on ? "3px solid " + theme.text.primary : "none", outlineOffset: 2, borderRadius: theme.radius.lg, fontFamily: theme.font.family, fontSize: theme.font.label.fontSize, lineHeight: theme.font.label.lineHeight, fontWeight: on ? 600 : 400, cursor: "pointer" }}>
                <div style={{ width: "100%", aspectRatio: "1 / 1", background: j.hex, borderRadius: theme.radius.md, overflow: "hidden" }}>
                  <img src={JACKET_IMG[i]} alt={j.name + "羽绒服"} onError={(e) => { e.currentTarget.style.display = "none"; }} style={{ width: "100%", height: "100%", objectFit: "cover" as const, display: "block", opacity: on ? 1 : 0.7 }} />
                </div>
                <span>{on ? "✓ " + j.name : j.name}</span>
              </button>
            );
          })}
        </div>
      </Section>
      <Section heading="第二步：抽选项">
        <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8 }}>
          <button onClick={() => setFaceRef(!faceRef)} style={{ ...chipBase, border: "1px solid " + (faceRef ? theme.border.strong : theme.border.default), background: faceRef ? theme.fill.secondary : "transparent" }}>{faceRef ? "脸参考图3：开" : "脸参考图3：关"}</button>
          {SLOTS.filter((d) => !(d.key === "face" && faceRef)).map((d) => {
            const on = locks[d.key];
            return (
              <button key={d.key} onClick={() => setLocks({ ...locks, [d.key]: !on })} style={{ ...chipBase, border: "1px solid " + (on ? theme.border.strong : theme.border.default), background: on ? theme.fill.secondary : "transparent" }}>
                {on ? <LockIcon /> : null}
                <span style={{ overflowWrap: "anywhere" as const }}>{chipText(d.key, vals[d.key])}</span>
              </button>
            );
          })}
          <button onClick={() => setMusicLock(!musicLock)} style={{ ...chipBase, border: "1px solid " + (musicLock ? theme.border.strong : theme.border.default), background: musicLock ? theme.fill.secondary : "transparent" }}>
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
        <div style={smallLabel}>配乐（换一组时随机，点上方配乐标签可锁定；手动点选仍可覆盖）</div>
        <Segmented options={MUSIC_OPTS} value={music} onChange={(v: string) => setMusic(v === "inst" || v === "none" ? v : "lyric")} />
        <Button label={copyLabel("vid", "复制 " + vidName + " 视频提示词")} variant="primary" onClick={() => doCopy("vid", videoText)} />
        <div style={smallLabel}>{"镜头组：" + plan.name + (plan.note ? "。" + plan.note : "")}</div>
        <div style={boxStyle}>{videoText}</div>
        <div style={smallLabel}>视频上传：生好的图作为图片1。</div>
        {copied === "fail" ? <Text>当前环境不允许自动复制，请长按选中文字后复制。</Text> : null}
      </Section>
      <Section heading="高级设置" collapsible defaultOpen={false}>
        <Select label="编辑选项池，每行一项" options={EDIT_KEYS.map((d) => ({ value: d.key, label: d.label + "（" + pools[d.key].length + " 项）" }))} value={editKey} onChange={chooseEdit} />
        <textarea value={editText} onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setEditText(e.target.value)} rows={10} style={{ width: "100%", boxSizing: "border-box" as const, border: "1px solid " + theme.border.default, borderRadius: theme.radius.md, padding: 12, background: "transparent", color: theme.text.primary, fontFamily: theme.font.family, fontSize: theme.font.body2.fontSize, lineHeight: theme.font.body2.lineHeight, resize: "vertical" as const }} />
        <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8 }}>
          <Button label="保存" variant="primary" onClick={savePool} />
          <Button label="恢复默认" onClick={resetPool} />
        </div>
        {editMsg ? <div style={smallLabel}>{editMsg}</div> : null}
      </Section>
    </Page>
  );
}
