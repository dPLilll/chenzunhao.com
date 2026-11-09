import {
  Page,
  Section,
  Text,
  Callout,
  Button,
  Properties,
  NumberedList,
  Divider,
  Table,
  useState,
  useGrokTheme,
  TableOfContents,
  Segmented,
} from "../ui/canvas";

type SceneId =
  | "park"
  | "office"
  | "metro"
  | "dorm"
  | "sofa"
  | "store"
  | "late_store"
  | "rooftop"
  | "parking"
  | "rain_bus"
  | "ktv"
  | "ski_lounge"
  | "hotpot"
  | "library"
  | "gym_hall"
  | "night_market"
  | "hotel_hall"
  | "elevator"
  | "cat_cafe";
type CastMode = "duo_friend" | "duo_male";
type BottomId = string;
type LookId = "long_straight" | "soft_wave" | "high_pony" | "friend_bob";
type ShotMode = "one_take" | "cuts";
type PoseId =
  | "stand_side"
  | "stand_face"
  | "sit_side"
  | "sit_face"
  | "lie_sit"
  | "lie_side";

type PoseCard = {
  id: PoseId;
  name: string;
  kind: "stand" | "sit" | "lie";
  face: boolean;
};

type SceneCard = {
  id: SceneId;
  name: string;
  hook: string;
  block: string;
  staging: string;
};

type BottomCard = {
  id: BottomId;
  name: string;
  line: string;
  vibe: string;
};

type LookCard = {
  id: LookId;
  name: string;
  line: string;
  forFriendOnly?: boolean;
};

/** PAGE_VER 0.0.28 · t142u：出图构图头顶留约画面15%空白 */
const PAGE_VER = "0.0.28";

/**
 * 成片秒数按写死4句台词口播时长加权（约 6 字/秒口播）：
 * 钩子短句≈3s、KEY长句≈6s、离谱短句≈2s、CTA中句≈4s → 合计 15。
 * 只输出精确秒数，禁止「12-15」「约15」等区间写法。
 */
const VIDEO_SHOT_DURS: number[] = [3, 6, 2, 4];
const VIDEO_SEC: number = VIDEO_SHOT_DURS.reduce(function (a, b) {
  return a + b;
}, 0);

function videoShotWindows(): {
  start: number;
  end: number;
  dur: number;
  label: string;
}[] {
  let t = 0;
  return VIDEO_SHOT_DURS.map(function (dur) {
    const start = t;
    const end = t + dur;
    t = end;
    return {
      start: start,
      end: end,
      dur: dur,
      label: String(start) + "-" + String(end) + "秒",
    };
  });
}

function videoDurBreakdown(): string {
  return (
    VIDEO_SHOT_DURS.map(function (d, i) {
      return "第" + String(i + 1) + "句" + String(d) + "秒";
    }).join("+") +
    "=" +
    String(VIDEO_SEC) +
    "秒"
  );
}

const NO_TEXT =
  "画面禁止出现字幕、烧录字幕、花字、贴纸、头像贴图、水印、标题、标价或任何可读中英文字符；字幕由后期单独添加。";

const FRAME =
  "构图以胸腰到膝上为主的半身中近景，脚部基本不入画。构图宽松不要顶天立地，头顶上方留出约画面高度15%的空白，头发完整入镜且不贴上沿。";

const MAIN_FACE =
  "东亚年轻女性，约22到26岁，圆脸偏鹅蛋，皮肤白里透粉，五官精致自然，头小颈长，体态偏瘦但不骨感";

const FRIEND_FACE =
  "同龄东亚女性闺蜜，五官与主模特明显区分，气质不同";

const MALE_FACE =
  "东亚年轻男性同事感，约24到28岁，短发干净利落，五官清爽日常不油腻，体态偏瘦";

/** 图片提示词不再用概括性「厚棉或线衣」覆盖领型；仅视频锁妆残留用 */
const TOP_BASE =
  "上身贴身三枪厚棉上装，领口与袖口织物纹理清晰可见";

const BOTTOMS: BottomCard[] = [
  {
    id: "wool_wide",
    name: "毛呢阔腿裤",
    vibe: "通勤利落",
    line: "高腰深灰或焦糖色毛呢阔腿裤，腰线收紧，裤型垂坠盖过膝下",
  },
  {
    id: "suit_wide",
    name: "西装阔腿裤",
    vibe: "干练",
    line: "高腰黑色或浅卡其西装阔腿裤，有垂感，裤长盖住小腿上段",
  },
  {
    id: "cord_wide",
    name: "灯芯绒阔腿",
    vibe: "复古暖",
    line: "高腰砖红色或墨绿灯芯绒阔腿裤，条绒纹理清晰，裤脚自然垂坠",
  },
  {
    id: "knit_straight",
    name: "针织直筒裤",
    vibe: "软糯",
    line: "高腰燕麦色或灰色针织直筒裤，柔软贴腿不紧身，长度过膝",
  },
  {
    id: "sweat",
    name: "廓形卫裤",
    vibe: "家居出门",
    line: "高腰燕麦或浅灰廓形阔腿卫裤，松弛垂坠，裤长过膝近小腿",
  },
  {
    id: "cargo",
    name: "工装气球裤",
    vibe: "街头",
    line: "高腰橄榄或卡其阔腿工装气球裤，大口袋，裤型鼓起后收束在膝下附近",
  },
  {
    id: "pleat_mid",
    name: "百褶中裙",
    vibe: "甜感",
    line: "高腰深色或格纹百褶中裙，裙长到膝盖附近，坐下时裙摆自然盖住大腿",
  },
  {
    id: "wool_a",
    name: "毛呢A字中裙",
    vibe: "秋冬正式",
    line: "高腰灰色或黑色毛呢A字中裙，裙长刚过膝，裙面挺括",
  },
  {
    id: "knit_skirt",
    name: "针织中裙",
    vibe: "温柔",
    line: "高腰米杏或浅咖针织中裙，弹性面料贴臀后自然放下，裙长到膝",
  },
  {
    id: "culottes",
    name: "裙裤",
    vibe: "好活动",
    line: "高腰深色裙裤，看起来像中裙实为分裤，长度到膝，裙长到膝",
  },
  {
    id: "velvet",
    name: "丝绒直筒裤",
    vibe: "略华丽",
    line: "高腰墨绿或酒红丝绒直筒裤，微光泽，裤长过膝",
  },
  {
    id: "pj",
    name: "家居长裤",
    vibe: "宿舍/沙发",
    line: "宽松格纹或纯色家居长裤，裤型松垮舒适，长度过膝，适合室内场景",
  },
];

const SCENES: SceneCard[] = [
  {
    id: "park",
    name: "游乐园夜景",
    hook: "啥家庭啊",
    block:
      "夜间游乐园，暖黄旋转木马灯光与白色金属栏杆虚化成光斑，橙色木质长椅，环境光柔和照亮人物与厚棉衣物纹理",
    staging: "两人并排坐长椅，说话者微侧身，听者看向对方",
  },
  {
    id: "office",
    name: "办公室摸鱼",
    hook: "又在摸鱼",
    block:
      "明亮开放式办公室，白色隔断、灰色工位、远处显示器与窗户虚化，日光灯均匀偏亮",
    staging: "一人坐办公椅看手机，另一人侧后方探头，随后转向镜头",
  },
  {
    id: "metro",
    name: "地铁通勤",
    hook: "站这么挤还刷",
    block: "夜晚正在运行的地铁车厢，银色扶手，车窗外城市夜景与站台灯被行驶速度拉成光带，车厢灯光偏冷白，人物清晰，能看出列车正在行驶",
    staging: "两人肩并肩扶扶手，列车保持行驶，车窗外夜景在动，先看手机再对身边人或镜头短促反应",
  },
  {
    id: "dorm",
    name: "宿舍夜聊",
    hook: "你又下单了",
    block: "女生宿舍夜间，暖色台灯，床沿，背景桌面与零食袋虚化",
    staging: "两人并排坐床沿亲密聊天",
  },
  {
    id: "sofa",
    name: "外卖到家",
    hook: "刚开门就刷到",
    block: "家里客厅沙发，傍晚窗光或落地灯暖光，外卖袋放一旁虚化",
    staging: "两人并排侧坐沙发，从看手机到抬头互动",
  },
  {
    id: "store",
    name: "便利店门口",
    hook: "站门口还在看",
    block:
      "便利店门口，白色铝框玻璃门与浅灰地砖，自动贩卖机虚化，夜间门内暖光漏出",
    staging: "两人并排站门口，可捧热饮，先对同伴再看镜头",
  },
  {
    id: "late_store",
    name: "深夜便利店",
    hook: "三点还在囤",
    block:
      "凌晨便利店冷白灯管，货架泡面与饮料虚化，玻璃门外夜色深蓝，人物被灯管照亮厚棉纹理",
    staging: "两人挤在冷柜前或门口柜台旁，压低声音吐槽又忍不住笑",
  },
  {
    id: "rooftop",
    name: "楼顶天台",
    hook: "风这么大还穿这",
    block:
      "居民楼天台夜景，水泥矮墙与远处城市灯火虚化，冷风感但人物衣物纹理清晰，顶灯或手机光补亮脸与领口",
    staging: "两人靠矮墙并排，一人指远处一人对镜头说话",
  },
  {
    id: "parking",
    name: "地下停车场",
    hook: "车位上都在聊",
    block:
      "地下停车场黄白顶灯，地面反光与车尾灯虚化，水泥柱与箭头地标，环境光偏冷但仍能看清厚棉织纹",
    staging: "两人站在车位线旁或电梯口，肩并肩压声聊天",
  },
  {
    id: "rain_bus",
    name: "雨夜公交站",
    hook: "等车等到起鸡皮",
    block:
      "雨夜公交站玻璃候车亭，雨水打在棚顶，路灯暖黄与车灯拖影虚化，人物半身被亭内光照亮",
    staging: "两人挤在候车亭里，一人看手机报班次一人对镜头种草",
  },
  {
    id: "ktv",
    name: "KTV包厢门口",
    hook: "唱完还在刷",
    block:
      "KTV走廊夜场灯光粉紫霓虹虚化，包厢门半掩，地毯与不锈钢门牌，人物被走廊灯照亮",
    staging: "两人靠走廊墙边，刚从包厢出来还喘着气聊天",
  },
  {
    id: "ski_lounge",
    name: "滑雪场室内",
    hook: "雪具房里还套这",
    block:
      "滑雪场室内休息区，木色墙板与雪具架虚化，窗外雪光偏亮，室内暖光打在厚棉领口袖口",
    staging: "两人坐休息长椅或站在落地窗前，对比窗外雪景聊保暖",
  },
  {
    id: "hotpot",
    name: "火锅店门口",
    hook: "刚吃完还想囤",
    block:
      "火锅店门口夜景，红灯笼与玻璃门内热气虚化，人行道浅景深，人物半身清晰",
    staging: "两人刚出店门并排站着，搓手又指领口说话",
  },
  {
    id: "library",
    name: "图书馆角落",
    hook: "安静到只剩衣响",
    block:
      "图书馆靠窗座位，书架纵深虚化，日光或台灯柔光，环境极静，厚棉织纹被侧光勾出",
    staging: "两人低头又抬头咬耳朵式聊天，动作幅度小",
  },
  {
    id: "gym_hall",
    name: "健身房走廊",
    hook: "练完还穿秋衣",
    block:
      "健身房走廊镜面与橡胶地面虚化，冷白灯，器械房门口景深浅，人物半身清晰",
    staging: "两人靠走廊墙边喝水间歇，对比运动服与厚棉笑场",
  },
  {
    id: "night_market",
    name: "夜市摊位旁",
    hook: "烤串味里种草",
    block:
      "夜市灯串暖黄，烟火气与摊位虚化，地面微湿反光，人物被灯串照亮衣物纹理",
    staging: "两人挤在摊位旁，一人拿签一人对镜头说话",
  },
  {
    id: "hotel_hall",
    name: "酒店走廊",
    hook: "退房前还在聊",
    block:
      "酒店长走廊地毯与壁灯，门牌虚化，暖黄均匀光，安静纵深，人物半身中近景",
    staging: "两人拖着小行李停在电梯厅外聊天",
  },
  {
    id: "elevator",
    name: "早高峰电梯",
    hook: "电梯里还安利",
    block:
      "写字楼电梯厢镜面不锈钢，楼层灯跳变，门外早高峰虚化，顶灯偏亮照清领口袖口",
    staging: "两人挤在电梯角落，压低声音对镜头或对对方说话",
  },
  {
    id: "cat_cafe",
    name: "猫咖窗边",
    hook: "猫都比我厚",
    block:
      "猫咖木桌与落地窗，猫咪毛团虚化，下午暖光，室内软装浅景深，人物衣物纹理清晰",
    staging: "两人坐窗边，一只猫在背景路过，人物对镜头或对彼此说话",
  },
];

const LOOKS: LookCard[] = [
  {
    id: "long_straight",
    name: "黑长直",
    line: "黑色自然黑长直发，中分或微侧分，发尾过肩，干净清爽",
  },
  {
    id: "soft_wave",
    name: "微卷长发",
    line: "黑色微卷长发，发丝蓬松有空气感，发尾自然卷过肩",
  },
  {
    id: "high_pony",
    name: "高马尾",
    line: "黑色高马尾，头顶略紧，马尾垂在脑后，显得利落有精神",
  },
  {
    id: "friend_bob",
    name: "短发闺蜜",
    line: "黑色齐耳短发或及肩短发，刘海自然，气质与主模特明显区分",
    forFriendOnly: true,
  },
];

const CAST_MODES: { id: CastMode; label: string; note: string }[] = [
  {
    id: "duo_friend",
    label: "双人 · 闺蜜感",
    note: "主模特 + 闺蜜；宿舍/猫咖/夜市等偏闺蜜场景",
  },
  {
    id: "duo_male",
    label: "双人 · 同事感",
    note: "办公室/地铁/电梯/停车场等可抽男同事",
  },
];

const SHOT_MODES: { value: ShotMode; label: string }[] = [
  { value: "one_take", label: "一镜到底" },
  { value: "cuts", label: "分镜4镜" },
];

type VidModel = "kling" | "jimeng";
const VID_MODELS: { value: VidModel; label: string }[] = [
  { value: "kling", label: "可灵" },
  { value: "jimeng", label: "即梦" },
];

const POSES: PoseCard[] = [
  { id: "stand_side", name: "并排站着闲聊", kind: "stand", face: false },
  { id: "stand_face", name: "面对面站着说话", kind: "stand", face: true },
  { id: "sit_side", name: "并排坐着", kind: "sit", face: false },
  { id: "sit_face", name: "面对面坐着说话", kind: "sit", face: true },
  { id: "lie_sit", name: "一人躺一人坐着说话", kind: "lie", face: true },
  { id: "lie_side", name: "并排躺着说话", kind: "lie", face: false },
];

function sceneById(id: SceneId): SceneCard {
  return SCENES.find((s) => s.id === id) || SCENES[0];
}

/** 场景 × 人物兼容：偏闺蜜/私密/离谱休闲不抽男同事；通勤职场公共可抽 */
function allowedCastsForScene(sceneId: SceneId): CastMode[] {
  switch (sceneId) {
    case "sofa":
    case "dorm":
    case "park":
    case "cat_cafe":
    case "ktv":
    case "night_market":
    case "library":
    case "hotel_hall":
    case "ski_lounge":
    case "hotpot":
      return ["duo_friend"];
    case "office":
    case "metro":
    case "store":
    case "late_store":
    case "parking":
    case "rain_bus":
    case "gym_hall":
    case "elevator":
    case "rooftop":
      return ["duo_friend", "duo_male"];
    default:
      return ["duo_friend"];
  }
}

function pickAllowedCast(sceneId: SceneId, preferred?: CastMode): CastMode {
  const pool = allowedCastsForScene(sceneId);
  if (preferred && pool.indexOf(preferred) >= 0) return preferred;
  return pool[Math.floor(Math.random() * pool.length)];
}

function castCompatible(sceneId: SceneId, mode: CastMode): boolean {
  return allowedCastsForScene(sceneId).indexOf(mode) >= 0;
}

function poseById(id: PoseId): PoseCard {
  return POSES.find((p) => p.id === id) || POSES[0];
}

/** 可坐：有座位/长椅/床沿的场景；地铁电梯健身房走廊等站着走的地方不坐 */
function sceneAllowsSit(sceneId: SceneId): boolean {
  switch (sceneId) {
    case "metro":
    case "elevator":
    case "gym_hall":
    case "parking":
    case "rooftop":
    case "store":
    case "late_store":
    case "hotpot":
    case "night_market":
      return false;
    default:
      return true;
  }
}

/** 可躺：沙发/床/休息区/猫咖等居家休息感；男同事永不躺 */
function sceneAllowsLie(sceneId: SceneId): boolean {
  switch (sceneId) {
    case "sofa":
    case "dorm":
    case "cat_cafe":
    case "hotel_hall":
    case "ski_lounge":
      return true;
    default:
      return false;
  }
}

function lieRestScenes(): SceneCard[] {
  return SCENES.filter((s) => sceneAllowsLie(s.id));
}

function poseCompatible(
  poseId: PoseId,
  sceneId: SceneId,
  mode: CastMode
): boolean {
  const pose = poseById(poseId);
  if (pose.kind === "lie") {
    if (mode !== "duo_friend") return false;
    if (!sceneAllowsLie(sceneId)) return false;
    return true;
  }
  if (pose.kind === "sit") {
    return sceneAllowsSit(sceneId);
  }
  return true;
}

function allowedPosesFor(sceneId: SceneId, mode: CastMode): PoseCard[] {
  return POSES.filter((p) => poseCompatible(p.id, sceneId, mode));
}

function pickAllowedPose(
  sceneId: SceneId,
  mode: CastMode,
  preferred?: PoseId
): PoseId {
  const pool = allowedPosesFor(sceneId, mode);
  if (preferred && pool.some((p) => p.id === preferred)) return preferred;
  const use = pool.length > 0 ? pool : POSES.filter((p) => p.kind === "stand");
  return use[Math.floor(Math.random() * use.length)].id;
}

function seatNoun(sceneId: SceneId): string {
  switch (sceneId) {
    case "park":
      return "橙色木质长椅";
    case "office":
      return "黑色办公椅";
    case "dorm":
      return "床沿";
    case "sofa":
      return "客厅沙发";
    case "ski_lounge":
      return "滑雪场休息长椅";
    case "library":
      return "图书馆靠窗座位";
    case "cat_cafe":
      return "猫咖窗边座位";
    case "hotel_hall":
      return "酒店走廊等候沙发";
    case "rain_bus":
      return "候车亭座椅";
    case "ktv":
      return "KTV走廊边座位";
    default:
      return "身边座位";
  }
}

function lieSurface(sceneId: SceneId): string {
  switch (sceneId) {
    case "dorm":
      return "宿舍床铺";
    case "sofa":
      return "客厅沙发";
    case "cat_cafe":
      return "猫咖懒人沙发";
    case "hotel_hall":
      return "酒店走廊长沙发";
    case "ski_lounge":
      return "休息区软座长沙发";
    default:
      return "沙发";
  }
}

function bottomById(id: BottomId): BottomCard {
  return BOTTOMS.find((b) => b.id === id) || BOTTOMS[0];
}

function lookById(id: LookId): LookCard {
  return LOOKS.find((l) => l.id === id) || LOOKS[0];
}

function mainLooks(): LookCard[] {
  return LOOKS.filter((l) => !l.forFriendOnly);
}

function friendLookLine(mainLookId: LookId): string {
  if (mainLookId === "friend_bob") {
    return LOOKS.find((l) => l.id === "soft_wave")!.line;
  }
  return LOOKS.find((l) => l.id === "friend_bob")!.line;
}

/** 开场无厘头钩子卡池（仅第1句可抽；KEY/离谱/CTA写死） */
const HOOK_POOL: string[] = [
  "明天去喜马拉雅露营吗？保暖内衣一下买4套？",
  "咱家小区划进北极圈了吗，保暖内衣一买就是4套？",
  "桌上1、2、3、4套保暖内衣加起来正好4套吧？",
  "你把三枪仓库劫了？为什么有4套保暖内衣？",
  "大师说今年迎来暖男，没让你买4套保暖内衣暖自己啊！",
  "老实交代，是不是谈了四个男朋友？内衣一买就是4套？",
  "快递问咱俩是不是搞服装批发的，内衣一买就是4套？",
  "明天去西伯利亚挖土豆吗，保暖内衣一买就是4套？",
  "啥家庭啊，保暖内衣一买就是4套？",
];

type SpokenLine = { speaker: string; text: string };

function speakerLabel(mode: CastMode): { main: string; partner: string } {
  if (mode === "duo_male") return { main: "主角", partner: "男同事" };
  return { main: "主角", partner: "闺蜜" };
}

/** 台词：第1句钩子可抽；KEY/离谱/CTA写死不可改。
 * 双人顺序：配角钩子 → 主角KEY → 配角离谱 → 主角CTA。
 */
const LINE_KEY =
  "现在三枪官方旗舰店搞双十一活动，厚棉套装大破价只要99一套，活动只有几天，不得多囤几套？";
const LINE_CRAZY = "这活动是不是有点离谱啦";
const LINE_CTA =
  "赶紧点头像到三枪官方旗舰店直播间，双十一大促快结束了";

function buildCopy(mode: CastMode, hook: string): SpokenLine[] {
  const sp = speakerLabel(mode);
  return [
    { speaker: sp.partner, text: hook },
    { speaker: sp.main, text: LINE_KEY },
    { speaker: sp.partner, text: LINE_CRAZY },
    { speaker: sp.main, text: LINE_CTA },
  ];
}

function linePerf(
  mode: CastMode,
  i: number,
  pose: PoseCard
): { mood: string; speak: string; listen: string } {
  const partner = mode === "duo_male" ? "男同事" : "闺蜜";
  const faceBit = pose.face
    ? "说话时看向对方眼睛，不是正对镜头念稿；"
    : "";
  const listenFace = pose.face
    ? "听者看着说话人，有表情反应，不另加台词；"
    : "";
  // i: 0钩子 1KEY 2离谱 3CTA — 台词原文不动，只写表演；姿态与参考图一致
  if (i === 0) {
    return {
      mood: "夸张无厘头开场，带点惊讶+嫌弃好笑",
      speak:
        faceBit +
        partner +
        "眼睛睁大、眉毛上挑，微微后仰又凑近，嘴角抽一下，语气像刚发现对方厚棉穿得离谱",
      listen: listenFace + "主角先愣半拍，再憋笑点头，眼神对上说话人",
    };
  }
  if (i === 1) {
    return {
      mood: "认真安利里夹惊喜，能量明显高于广告念稿",
      speak:
        faceBit +
        "主角身体前倾，手指轻点自己厚棉领口或袖口，语速利落，说到「99一套」「多囤」时眼睛发亮、语气上扬",
      listen:
        listenFace +
        partner +
        "先皱眉听，再慢慢睁大眼点头，嘴型无声附和「嗯？」",
    };
  }
  if (i === 2) {
    return {
      mood: "夸张嫌弃式吐槽，无厘头但不恶毒",
      speak:
        faceBit +
        partner +
        "撇嘴、侧目、单肩耸一下，手在胸前虚推一下，像觉得「这也太夸张了」",
      listen: listenFace + "主角被噎到又得意，抿嘴偷笑，眼神可短暂瞟镜头一下",
    };
  }
  return {
    mood: "紧迫召唤，结尾拉高能量",
    speak:
      "主角转向镜头，声音提高半度，手指指向镜头下方（提示观众点进入口），眉心微拧带催促感，说到「快结束了」时更急；画面不出现头像贴纸或任何文字；身体仍保持参考图姿态不突然起立换姿",
    listen: partner + "跟着点头，身体微侧让出镜头，表情配合「真的赶紧」",
  };
}

function dialogueBlock(mode: CastMode, hook: string, pose: PoseCard): string {
  const lines = buildCopy(mode, hook);
  const lineText = lines
    .map((l, i) => {
      const p = linePerf(mode, i, pose);
      return (
        String(i + 1) +
        ".（" +
        l.speaker +
        "）「" +
        l.text +
        "」｜情绪：" +
        p.mood +
        "｜说者：" +
        p.speak +
        "｜听者：" +
        p.listen
      );
    })
    .join("\n");
  return (
    "【台词（写死 · 禁止改写）】一人一句轮流：主配交替，每句只一人开口，禁止两人同句合唱。" +
    "口型必须对准下列引号内原文，禁止改词、禁止加台词、禁止自创对白；情绪与肢体只服务表演，不新增对白：\n" +
    lineText +
    "\n后期字幕只显示引号内原文，与说话人一一对应。"
  );
}

/** 由抽卡标记 n + 选项 id 生成稳定种子；同一次抽卡内点复制不改变提示词 */
function hashPromptSeed(parts: string[]): number {
  let h = 2166136261;
  const s = parts.join("|");
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickOrFork(s: string, rnd: () => number): string {
  // 把「A或B」落成单一具体项；rnd 由抽卡种子驱动，渲染期可复现
  let out = s;
  const re = /([^，。；、\n]{1,18})或([^，。；、\n]{1,18})/g;
  for (let i = 0; i < 8; i++) {
    const next = out.replace(re, (_m, a, b) =>
      rnd() < 0.5 ? String(a) : String(b)
    );
    if (next === out) break;
    out = next;
  }
  return out;
}

function concreteBottomLine(bottom: BottomCard, rnd: () => number): string {
  return pickOrFork(bottom.line, rnd)
    .replace(/，?不露脚踝细节/g, "")
    .replace(/，?但不露脚/g, "")
    .replace(/，?不强调鞋款/g, "");
}

function concreteLookLine(raw: string, rnd: () => number): string {
  return pickOrFork(raw, rnd);
}

function imagePropBit(sceneId: SceneId, rnd: () => number): string {
  switch (sceneId) {
    case "park":
      return rnd() < 0.55
        ? "主角右手拿着白色软冰淇淋甜筒；"
        : "双手空闲，不拿甜筒；";
    case "store":
    case "late_store":
    case "hotpot":
      return rnd() < 0.55
        ? "主角双手捧着一杯热饮；"
        : "双手空闲；";
    case "office":
    case "metro":
    case "sofa":
    case "elevator":
    case "rain_bus":
    case "parking":
      return rnd() < 0.6
        ? "主角手里拿着银色手机；"
        : "双手自然放松；";
    case "dorm":
    case "library":
    case "hotel_hall":
      return rnd() < 0.5 ? "主角手里拿着手机；" : "双手搭在膝上；";
    case "night_market":
      return rnd() < 0.55
        ? "一人手里拿着烤串签；"
        : "双手空闲；";
    case "gym_hall":
      return rnd() < 0.5
        ? "一人手里拿着运动水壶；"
        : "双手空闲；";
    case "cat_cafe":
      return "桌上可有一杯饮料，手不挡领口；";
    case "ktv":
    case "ski_lounge":
    case "rooftop":
    default:
      return "";
  }
}

function imagePoseBit(sceneId: SceneId, pose: PoseCard): string {
  const seat = seatNoun(sceneId);
  const surface = lieSurface(sceneId);
  const topKeep =
    "上身厚棉领口袖口与主体织物纹理清晰可见，不用被子、毯子或厚外套盖住上装；";
  switch (pose.id) {
    case "stand_side":
      return "姿态：两人并排站着闲聊，肩并肩，身体可微侧交谈；";
    case "stand_face":
      return "姿态：两人面对面站着说话，身体转向对方，不是并排正对镜头的画册站姿；";
    case "sit_side":
      return "姿态：两人并排坐在" + seat + "上闲聊；";
    case "sit_face":
      return (
        "姿态：两人面对面坐在" +
        seat +
        "上说话，身体转向对方，不是并排正对镜头；"
      );
    case "lie_sit":
      return (
        "姿态：一人侧躺在" +
        surface +
        "上，另一人坐在旁侧说话；" +
        topKeep
      );
    case "lie_side":
      return (
        "姿态：两人并排半躺或侧躺在" +
        surface +
        "上说话；" +
        topKeep
      );
    default:
      return "姿态：两人同框；";
  }
}

function imageInteractBit(mode: CastMode, pose: PoseCard): string {
  const partner = mode === "duo_male" ? "男同事" : "闺蜜";
  if (pose.face) {
    return (
      "互动生动有戏但不过度表演：说话人看着" +
      partner +
      "的眼睛开口，听者有表情反应；面对面交谈感，不是双人并排lookbook；适合做视频开场第一帧。"
    );
  }
  if (mode === "duo_male") {
    return "互动生动有戏但不过度表演：主角侧头张嘴说话，男同事先看手机再抬头配合反应；适合做视频开场第一帧。";
  }
  return "互动生动有戏但不过度表演：主角微微挑眉、张嘴说话，闺蜜转头看她、忍笑回应；适合做视频开场第一帧。";
}

function imageFrameSide(mode: CastMode, pose: PoseCard): string {
  if (pose.face) {
    return "两人面对面分居画面左右，身体朝向彼此；";
  }
  if (mode === "duo_male") {
    return "主模特在画面前景偏右，男同事在侧后方；";
  }
  return "主模特在画面偏右前景，闺蜜在左侧稍靠后；";
}

function colorLockNote(): string {
  return (
    "颜色与领型、袖口、织法、版型一律以对应实物参考图为准，文字不覆盖款式细节。环境光（含暖黄光）可提亮明暗，但不得改变衣服原本色相。" +
    "两张上传图各自决定对应人物上衣外观；两色以用户上传实物为准且须明显不同，禁止同色或对调。"
  );
}

function buildImagePrompt(
  scene: SceneCard,
  mode: CastMode,
  bottom: BottomCard,
  look: LookCard,
  pose: PoseCard,
  seed: number
): string {
  const rnd = mulberry32(seed);
  const bottomConcrete = concreteBottomLine(bottom, rnd);
  const mainHair = concreteLookLine(look.line, rnd);
  const friendHair = concreteLookLine(friendLookLine(look.id), rnd);
  const prop = imagePropBit(scene.id, rnd);
  const poseBit = imagePoseBit(scene.id, pose);
  const interact = imageInteractBit(mode, pose);
  const side = imageFrameSide(mode, pose);

  const mod1 =
    "【1. 参考图与服装锁定】图片1 = 主角上身实物参考；图片2 = 配角上身实物参考。按序上传两张不同色实物图（颜色以用户本次上传为准）。图片1只决定主角上衣，图片2只决定配角上衣；颜色、领型、袖口、织法与版型严格还原对应参考图，禁止改款改色改面料、禁止两人服装对调或同色。" +
    colorLockNote();

  let mod2: string;
  if (mode === "duo_male") {
    const maleBottom =
      rnd() < 0.5 ? "深灰直筒西装裤" : "卡其直筒休闲裤";
    mod2 =
      "【2. 人物与穿搭】双人同框。" +
      side +
      "主角：" +
      MAIN_FACE +
      "；发型：" +
      mainHair +
      "；上衣锁定图片1；下装：" +
      bottomConcrete +
      "。男同事：" +
      MALE_FACE +
      "；上衣锁定图片2（贴身厚棉上装，领口袖口纹理可见）；下装：" +
      maleBottom +
      "。两人发型五官明显区分。";
  } else {
    mod2 =
      "【2. 人物与穿搭】双人同框。" +
      side +
      "两人同为东亚年轻女性，约22到26岁，皮肤白里透粉，体态偏瘦但不骨感；发型五官必须明显区分。" +
      "主角：" +
      MAIN_FACE +
      "；发型：" +
      mainHair +
      "；上衣锁定图片1。" +
      "闺蜜：" +
      FRIEND_FACE +
      "；发型：" +
      friendHair +
      "；上衣锁定图片2。" +
      "两人下装统一为：" +
      bottomConcrete +
      "。";
  }

  const mod3 =
    "【3. 场景与人物互动】" +
    scene.block +
    "。" +
    poseBit +
    prop +
    interact;

  const mod4 =
    "【4. 摄影构图与质感】竖屏 9:16；半身中近景，胸腰到膝上，脚部不入画；构图宽松不要顶天立地，头顶上方留出约画面高度15%的空白，头发完整入镜且不贴上沿；真实生活抓拍感，浅景深，背景虚化有层次；皮肤纹理自然不过滤。" +
    "两件上装的领口、袖口与主体织物纹理清晰可见，不被头发、手臂、道具、被子或毯子大面积遮挡（种草核心）。" +
    "环境光自然照亮衣物，保留参考图色相。";

  const mod5 =
    "【5. 必要负面约束】" +
    NO_TEXT +
    "禁止改色改款；禁止主角配角上衣同色或对调参考图；禁止人物畸形、五官崩坏。";

  return (
    mod1 +
    "\n\n" +
    mod2 +
    "\n\n" +
    mod3 +
    "\n\n" +
    mod4 +
    "\n\n" +
    mod5
  );
}
function castLine(
  mode: CastMode,
  bottom: BottomCard,
  look: LookCard
): string {
  if (mode === "duo_male") {
    return (
      "双人同事同框，@图片1/图1 里两人全部锁定（主角上衣=上传图主角件，男同事上衣=上传图配角件，两色以实拍为准且异色）；发型保持「" +
      look.name +
      "」，下装「" +
      bottom.name +
      "」；男同事可先看手机，主模特探头或对镜头反应，片尾可指向镜头。"
    );
  }
  return (
    "双人闺蜜同框，@图片1/图1 里两人脸型发型体型与衣着全部锁定（主角上衣=上传图主角件，闺蜜上衣=上传图配角件，两色以实拍为准且异色）；发型保持「" +
    look.name +
    "」，下装「" +
    bottom.name +
    "」；主反应在主模特，闺蜜可在画面左侧或侧后方搭话。"
  );
}

function videoStaging(scene: SceneCard, mode: CastMode, pose: PoseCard): string {
  const partner = mode === "duo_male" ? "男同事" : "闺蜜";
  const seat = seatNoun(scene.id);
  const surface = lieSurface(scene.id);
  const keep =
    "全程保持与参考图相同姿态，禁止中途突然起立、坐下或换躺姿；";
  const face =
    pose.face
      ? "说话人看向" + partner + "，听者有表情反应，一人一句不合唱；"
      : "主配同框互动清晰，一人一句；";
  switch (pose.id) {
    case "stand_side":
      return keep + "两人并排站着闲聊。" + face + "场景：" + scene.name;
    case "stand_face":
      return keep + "两人面对面站着说话，身体转向对方。" + face + "场景：" + scene.name;
    case "sit_side":
      return keep + "两人并排坐在" + seat + "上。" + face;
    case "sit_face":
      return keep + "两人面对面坐在" + seat + "上说话。" + face;
    case "lie_sit":
      return (
        keep +
        "一人侧躺在" +
        surface +
        "，另一人坐在旁侧；上装领口袖口不被被子遮挡。" +
        face
      );
    case "lie_side":
      return (
        keep +
        "两人并排半躺在" +
        surface +
        "上说话；上装领口袖口清晰可见。" +
        face
      );
    default:
      return keep + "双人同框。" + face;
  }
}

function buildCutsBlock(
  scene: SceneCard,
  lines: SpokenLine[],
  mode: CastMode,
  pose: PoseCard
): string {
  const shots: string[] = [];
  const cams = ["固定中近景", "极轻微推近", "固定半身", "固定中近景"];
  const wins = videoShotWindows();
  for (let i = 0; i < 4; i++) {
    const s = wins[i];
    const line = lines[i];
    const p = linePerf(mode, i, pose);
    const who = line.speaker;
    shots.push(
      "Shot " +
        String(i + 1) +
        "（" +
        s.label +
        " · 本镜 " +
        String(s.dur) +
        " 秒）：运镜=" +
        cams[i] +
        "；主体=延续@图片1双人与「" +
        scene.name +
        "」场景；姿态保持「" +
        pose.name +
        "」与参考图一致；情绪=" +
        p.mood +
        "；说者表演=" +
        p.speak +
        "；听者反应=" +
        p.listen +
        "；本镜只由「" +
        who +
        "」开口，台词必须是「" +
        line.text +
        "」（一字不改）；口型与切镜对齐，禁止合唱、禁止自创对白、禁止面无表情。"
    );
  }
  const head =
    "【分镜 · 4镜硬切】成片时长 " +
    String(VIDEO_SEC) +
    " 秒整（按台词口播加权：" +
    videoDurBreakdown() +
    "，禁止改总时长，禁止写成秒数区间）。双人一人一句，情绪要有起伏：无厘头钩子 → 惊喜安利 → 嫌弃吐槽 → 紧迫CTA；Shot1-4 一一对应写死台词1-4；硬切，不要溶解。\n";
  return head + shots.join("\n");
}
function partnerWord(mode: CastMode): string {
  return mode === "duo_male" ? "男同事" : "闺蜜";
}

/** 情绪具象外化（可见肢体）；台词原文另写 */
function actingBeat(
  mode: CastMode,
  i: number,
  pose: PoseCard
): { speakAct: string; listenAct: string } {
  const partner = partnerWord(mode);
  const look = pose.face
    ? "说话人看向对方眼睛，"
    : "说话人面向同伴，";
  if (i === 0) {
    return {
      speakAct:
        look +
        partner +
        "眼睛睁大、眉毛上挑，微微后仰又凑近，嘴角抽一下",
      listenAct: "主角先愣半拍，再憋笑轻轻点头",
    };
  }
  if (i === 1) {
    return {
      speakAct:
        look +
        "主角身体前倾，手指轻点自己厚棉领口，语速利落，说到价格时眼睛发亮",
      listenAct: partner + "先皱眉听，再慢慢睁大眼点头",
    };
  }
  if (i === 2) {
    return {
      speakAct:
        look + partner + "撇嘴侧目，单肩轻轻一耸，手在胸前虚推一下",
      listenAct: "主角被噎到又得意，抿嘴偷笑",
    };
  }
  return {
    speakAct:
      "主角转向镜头，声音提高半度，手指指向镜头下方（提示观众点进入口），眉心微拧；画面不出现头像贴纸或任何文字",
    listenAct: partner + "跟着点头，身体微侧让出镜头",
  };
}

function poseKeepLine(pose: PoseCard): string {
  return (
    "保持「" +
    pose.name +
    "」姿态，中途不突然起立、坐下或换躺姿"
  );
}

function sceneBgMotion(sceneId: SceneId): string {
  if (sceneId === "metro") {
    return "列车全程保持运行，车窗外城市夜景与站台灯持续向后流动并拉成光带，车厢有轻微规律晃动；人物相对稳定地扶着扶手，不要把车厢拍成停站静止。";
  }
  return "";
}

/**
 * 可灵图生视频：官方 I2V（Subject+Movement）与 4.0 结构化分段。
 * 不复述仍图已有长相衣着布景；复制文本内不写模型或产品名。
 */
function buildKlingVideoPrompt(
  scene: SceneCard,
  mode: CastMode,
  shotMode: ShotMode,
  hook: string,
  pose: PoseCard,
  seed: number
): string {
  void seed;
  const lines = buildCopy(mode, hook);
  const wins = videoShotWindows();
  const keep = poseKeepLine(pose);
  const face = pose.face
    ? "面对面时说话人看对方，听者有表情反应。"
    : "";

  const beats = lines
    .map(function (l, i) {
      const a = actingBeat(mode, i, pose);
      const w = wins[i];
      return (
        String(w.start) +
        "-" +
        String(w.end) +
        "秒：" +
        a.speakAct +
        "，由「" +
        l.speaker +
        "」说「" +
        l.text +
        "」；" +
        a.listenAct +
        "。" +
        keep +
        "。"
      );
    })
    .join("\n");

  const shotLines = lines
    .map(function (l, i) {
      const a = actingBeat(mode, i, pose);
      const w = wins[i];
      return (
        "镜头" +
        String(i + 1) +
        ":" +
        String(w.dur) +
        "s。" +
        a.speakAct +
        "，「" +
        l.speaker +
        "」说「" +
        l.text +
        "」；" +
        a.listenAct +
        "。" +
        keep +
        "。"
      );
    })
    .join("\n");

  const head =
    "@图片1 作为首帧，保持面孔、发型、服装与当前姿态一致。\n\n" +
    "【素材职责】@图片1 是首帧，保持面孔、发型、服装与当前姿态一致；后续动作须符合图中物理可能，避免大幅偏离导致切镜。\n\n" +
    "【整体设定】生活抓拍竖屏中近景，固定机位或极轻手持；成片" +
    String(VIDEO_SEC) +
    "秒整（" +
    videoDurBreakdown() +
    "），禁止写成秒数区间。" +
    face +
    sceneBgMotion(scene.id) +
    "\n\n";

  let events: string;
  if (shotMode === "cuts") {
    events =
      "【分段事件】按分镜计时硬切，每镜一人一句：\n" + shotLines + "\n";
  } else {
    events =
      "【分段事件】全程为一个持续展开的主镜头，不出现可见剪辑。时间节拍如下：\n" +
      beats +
      "\n";
  }

  const sound =
    "【声音】一人一句口播，台词必须是上列引号内原文，禁止改词或自创对白；可有轻微环境声；无背景音乐；无字幕、无烧录字幕、无花字、无贴纸、无头像贴图、无水印。\n\n" +
    "口播「点头像」只是台词，禁止在画面里生成头像贴纸、圆形头像贴图、花字、底部贴纸条、直播间控件、界面按钮；说到这句时可用手指指向镜头下方，但不要画出任何贴纸或UI。\n\n" +
    "情绪外化顺序：无厘头惊讶嫌弃、惊喜安利、嫌弃吐槽、紧迫指向镜头。面部稳定，领口袖口可见。";

  return head + events + sound;
}

/**
 * 即梦视频进阶公式：精准主体+动作细节+场景环境+光影色调+镜头运镜+视觉风格+画质+约束。
 * 官方：不强制每段精确秒数；分镜用镜头1/2/3/4；台词用 {}；复制文本内不写模型或产品名。
 */
function buildVideoPrompt(
  scene: SceneCard,
  mode: CastMode,
  bottom: BottomCard,
  look: LookCard,
  shotMode: ShotMode,
  hook: string,
  pose: PoseCard,
  seed: number
): string {
  void bottom;
  void look;
  void seed;
  const lines = buildCopy(mode, hook);
  const keep = poseKeepLine(pose);
  const cams =
    shotMode === "cuts"
      ? ["固定中近景", "极轻微推近", "固定半身", "固定中近景"]
      : ["固定中近景或极轻手持呼吸感", "同镜延续", "同镜延续", "同镜延续"];

  const subject =
    mode === "duo_male"
      ? "将图片1中靠前的东亚年轻女性定义为主角，将图片1中同框的短发清爽男性定义为配角（男同事）。"
      : "将图片1中靠前的东亚年轻女性定义为主角，将图片1中同框的另一位年轻女性定义为配角（闺蜜）。";

  const open =
    subject +
    "主角与配角均延续图片1的面孔、发型、服装与「" +
    pose.name +
    "」姿态。" +
    keep +
    "。场景延续图片1（" +
    scene.name +
    "），不改景不换装。" +
    sceneBgMotion(scene.id) +
    "成片按界面设定" +
    String(VIDEO_SEC) +
    "秒，不在分镜内写死秒表。\n\n";

  const shots = lines
    .map(function (l, i) {
      const a = actingBeat(mode, i, pose);
      const who = l.speaker === "主角" ? "主角" : "配角";
      const cam = cams[i];
      if (shotMode === "cuts") {
        return (
          "镜头" +
          String(i + 1) +
          "：" +
          cam +
          "。" +
          a.speakAct +
          "，" +
          who +
          "说 {" +
          l.text +
          "}；" +
          a.listenAct +
          "。" +
          keep +
          "。"
        );
      }
      return (
        "节拍" +
        String(i + 1) +
        "（同镜连续）：" +
        a.speakAct +
        "，" +
        who +
        "说 {" +
        l.text +
        "}；" +
        a.listenAct +
        "。" +
        keep +
        "。"
      );
    })
    .join("\n");

  let body: string;
  if (shotMode === "cuts") {
    body = "分镜按事件顺序，每镜一种运镜，一人一句：\n" + shots + "\n\n";
  } else {
    body =
      "一镜到底：单一场景内连续长镜头文戏，不出现可见剪辑，固定或极轻手持。按对话节拍推进：\n" +
      shots +
      "\n\n";
  }

  const close =
    "光影色调延续图片1，生活抓拍竖屏，高清细节丰富，色彩自然。" +
    "人物情绪外化顺序：无厘头惊讶、惊喜安利、嫌弃吐槽、紧迫指向镜头；眼神交流真实，像朋友吐槽不是念广告。" +
    "保持无字幕；不要生成水印；不要生成Logo；不要生成贴纸、头像贴图、花字、字幕条、界面控件。" +
    "口播「点头像」只是台词，禁止在画面里生成头像贴纸、圆形头像贴图、花字、底部贴纸条、直播间控件、界面按钮；说到这句时可用手指指向镜头下方，但不要画出任何贴纸或UI。" +
    "面部稳定不变形；动作自然流畅无卡顿；禁止自创对白。";

  return open + body + close;
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


type LockSlot =
  | "scene"
  | "bottom"
  | "mode"
  | "look"
  | "shot"
  | "hook"
  | "pose";

type Locks = Record<LockSlot, boolean>;

const NO_LOCKS: Locks = {
  scene: false,
  bottom: false,
  mode: false,
  look: false,
  shot: false,
  hook: false,
  pose: false,
};

function LockIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      aria-hidden="true"
    >
      <rect x="2.2" y="5.4" width="7.6" height="5" rx="1.2" />
      <path d="M4 5.4V3.8a2 2 0 0 1 4 0v1.6" />
    </svg>
  );
}

function scenesForMode(mode: CastMode): SceneCard[] {
  return SCENES.filter((s) => castCompatible(s.id, mode));
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function App() {
  const theme = useGrokTheme();
  const [sceneId, setSceneId] = useState<SceneId>("park");
  const [mode, setMode] = useState<CastMode>("duo_friend");
  const [bottomId, setBottomId] = useState<BottomId>("wool_wide");
  const [lookId, setLookId] = useState<LookId>("long_straight");
  const [shotMode, setShotMode] = useState<ShotMode>("one_take");
  const [hook, setHook] = useState<string>(HOOK_POOL[0]);
  const [poseId, setPoseId] = useState<PoseId>("sit_side");
  const [locks, setLocks] = useState<Locks>(NO_LOCKS);
  const [n, setN] = useState(0);
  const [copied, setCopied] = useState<string>("");
  const [vidModel, setVidModel] = useState<VidModel>("kling");

  const scene = sceneById(sceneId);
  const bottom = bottomById(bottomId);
  // 防御：若人物与当前场景不兼容（例如手动残留），落到允许池首项
  const resolvedMode: CastMode = castCompatible(sceneId, mode)
    ? mode
    : allowedCastsForScene(sceneId)[0];
  const resolvedPoseId: PoseId = poseCompatible(poseId, sceneId, resolvedMode)
    ? poseId
    : (allowedPosesFor(sceneId, resolvedMode)[0] || POSES[0]).id;
  const pose = poseById(resolvedPoseId);
  const look =
    resolvedMode === "duo_male"
      ? lookById(lookId === "friend_bob" ? "long_straight" : lookId)
      : lookById(lookId === "friend_bob" ? "long_straight" : lookId);
  const promptSeed = hashPromptSeed([
    String(n),
    sceneId,
    resolvedMode,
    bottomId,
    look.id,
    resolvedPoseId,
    hook,
    shotMode,
  ]);
  const imagePrompt = buildImagePrompt(
    scene,
    resolvedMode,
    bottom,
    look,
    pose,
    promptSeed
  );
  const videoPromptKling = buildKlingVideoPrompt(
    scene,
    resolvedMode,
    shotMode,
    hook,
    pose,
    promptSeed
  );
  const videoPromptJimeng = buildVideoPrompt(
    scene,
    resolvedMode,
    bottom,
    look,
    shotMode,
    hook,
    pose,
    promptSeed
  );
  const videoPrompt =
    vidModel === "kling" ? videoPromptKling : videoPromptJimeng;
  const vidName = vidModel === "kling" ? "可灵" : "即梦";
  const copyLines = buildCopy(resolvedMode, hook);
  const modeMeta =
    CAST_MODES.find((m) => m.id === resolvedMode) || CAST_MODES[0];
  const shotMeta = SHOT_MODES.find((s) => s.value === shotMode) || SHOT_MODES[0];

  const bump = () => setN((x) => x + 1);
  const doCopy = async (which: string, text: string) => {
    setCopied((await copyText(text)) ? which : "fail");
  };
  const copyLabel = (which: string, base: string) =>
    copied === which ? "已复制" : base;

  const toggleLock = (key: LockSlot) => {
    setLocks((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const unlockAll = () => setLocks(NO_LOCKS);

  const lockCount =
    (locks.scene ? 1 : 0) +
    (locks.bottom ? 1 : 0) +
    (locks.mode ? 1 : 0) +
    (locks.look ? 1 : 0) +
    (locks.shot ? 1 : 0) +
    (locks.hook ? 1 : 0) +
    (locks.pose ? 1 : 0);

  const doDraw = () => {
    // 已锁定的标签保持不变；上衣色以用户上传实物图为准
    // 姿态×场景×出镜兼容：躺姿仅闺蜜+休息场景；坐姿需有座位
    let nextScene = sceneId;
    let nextMode = mode;
    let nextPose = poseId;
    let nextLocks = { ...locks };

    // 若姿态锁在躺姿：强制闺蜜 + 休息场景（可破场景/出镜锁）
    if (locks.pose && poseById(poseId).kind === "lie") {
      nextMode = "duo_friend";
      setMode(nextMode);
      if (locks.mode && mode !== "duo_friend") {
        nextLocks = { ...nextLocks, mode: false };
      }
      if (!sceneAllowsLie(nextScene)) {
        const rest = lieRestScenes();
        nextScene = pickRandom(rest.length > 0 ? rest : SCENES).id;
        setSceneId(nextScene);
        if (locks.scene) nextLocks = { ...nextLocks, scene: false };
      }
      nextPose = poseId;
    } else {
      if (!locks.scene) {
        let pool = locks.mode ? scenesForMode(mode) : SCENES;
        if (locks.pose && poseById(poseId).kind === "sit") {
          pool = pool.filter((s) => sceneAllowsSit(s.id));
        }
        if (locks.pose && poseById(poseId).kind === "lie") {
          pool = pool.filter((s) => sceneAllowsLie(s.id));
        }
        nextScene = pickRandom(pool.length > 0 ? pool : SCENES).id;
        setSceneId(nextScene);
      }

      if (!locks.mode) {
        nextMode = pickAllowedCast(nextScene);
        setMode(nextMode);
      } else if (!castCompatible(nextScene, mode)) {
        nextMode = pickAllowedCast(nextScene);
        setMode(nextMode);
        nextLocks = { ...nextLocks, mode: false };
      } else {
        nextMode = mode;
      }

      if (!locks.pose) {
        const pool = allowedPosesFor(nextScene, nextMode);
        const avoid =
          pool.length > 1
            ? pool.filter((p) => p.id !== poseId)
            : pool;
        nextPose = pickRandom(avoid.length > 0 ? avoid : pool.length > 0 ? pool : POSES.filter((p) => p.kind === "stand")).id;
        setPoseId(nextPose);
      } else if (!poseCompatible(poseId, nextScene, nextMode)) {
        // 姿态已锁但不兼容 → 保姿态，改场景/出镜
        if (poseById(poseId).kind === "lie") {
          nextMode = "duo_friend";
          setMode(nextMode);
          nextLocks = { ...nextLocks, mode: false };
          const rest = lieRestScenes();
          nextScene = pickRandom(rest.length > 0 ? rest : SCENES).id;
          setSceneId(nextScene);
          nextLocks = { ...nextLocks, scene: false };
          nextPose = poseId;
        } else {
          nextPose = pickAllowedPose(nextScene, nextMode);
          setPoseId(nextPose);
          nextLocks = { ...nextLocks, pose: false };
        }
      } else {
        nextPose = poseId;
      }
    }

    if (!locks.bottom) {
      setBottomId(pickRandom(BOTTOMS).id);
    }

    if (!locks.look) {
      setLookId(pickRandom(mainLooks()).id);
    }

    if (!locks.shot) {
      setShotMode(Math.random() < 0.5 ? "one_take" : "cuts");
    }

    if (!locks.hook) {
      const pool =
        HOOK_POOL.length > 1
          ? HOOK_POOL.filter(function (h) {
              return h !== hook;
            })
          : HOOK_POOL;
      setHook(pickRandom(pool));
    }

    setLocks(nextLocks);
    bump();
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

  const hookChip =
    hook.length > 16 ? "钩子：" + hook.slice(0, 16) + "…" : "钩子：" + hook;
  const drawChips: { key: LockSlot; label: string; show: boolean }[] = [
    { key: "hook", label: hookChip, show: true },
    { key: "pose", label: "姿态：" + pose.name, show: true },
    { key: "scene", label: "场景：" + scene.name, show: true },
    { key: "bottom", label: "下装：" + bottom.name, show: true },
    { key: "mode", label: "出镜：" + modeMeta.label, show: true },
    { key: "look", label: "发型：" + look.name, show: true },
    { key: "shot", label: "镜头：" + shotMeta.label, show: true },
  ];

  return (
    <Page
      title="三枪双十一种草 · 提示词生产单"
      summary={
        PAGE_VER +
        "。标签抽卡 → 五模块出图 → 视频选可灵或即梦。钩子可抽；KEY/离谱/CTA写死；双人15秒精确；一键复制。"
      }
      lang="zh-Hans"
      width="column"
    >
      <TableOfContents
        items={[
          { label: "抽卡", id: "draw" },
          { label: "出图", id: "image" },
          { label: "视频", id: "video" },
          { label: "口播要点", id: "copy" },
          { label: "下装卡池", id: "bottoms" },
          { label: "场景卡池", id: "scene" },
          { label: "后期", id: "post" },
        ]}
      />

      <Section heading="第一步：抽选项" id="draw">
        <div
          style={{
            display: "flex",
            flexWrap: "wrap" as const,
            gap: 8,
          }}
        >
          {drawChips
            .filter((c) => c.show)
            .map((c) => {
              const on = locks[c.key];
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => toggleLock(c.key)}
                  aria-pressed={on}
                  style={{
                    ...chipBase,
                    border:
                      "1px solid " +
                      (on ? theme.border.strong : theme.border.default),
                    background: on ? theme.fill.secondary : "transparent",
                  }}
                >
                  {on ? <LockIcon /> : null}
                  <span style={{ overflowWrap: "anywhere" as const }}>
                    {c.label}
                  </span>
                </button>
              );
            })}
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap" as const,
            alignItems: "center",
            gap: 12,
          }}
        >
          <Button
            label="全部解锁"
            onClick={unlockAll}
            disabled={lockCount === 0}
          />
          <div style={smallLabel}>
            {lockCount > 0
              ? "已锁定 " + lockCount + " 项，换一组时保持不变。"
              : "点标签可锁定，换一组时保持不变。"}
          </div>
        </div>
        <Button label="换一组" variant="primary" onClick={doDraw} />
        <div style={smallLabel}>
          未锁定标签随机：钩子 / 姿态 / 场景 / 下装 / 出镜 / 发型 / 镜头。姿态含站坐躺与面对面；躺姿仅闺蜜+休息场景。第1句无厘头可抽；KEY厚棉99、离谱、CTA写死。双人上传图片1+图片2。抽卡标记：{String(n)}
        </div>
      </Section>

      <Section heading="第二步：生成提示词" id="image">
        <Callout tone="warning" lead="硬约束">
          {NO_TEXT} 竖屏 9:16 半身中近景；脚不入画。台词写死，禁止模型自创对白。
        </Callout>
        <div style={smallLabel}>出图提示词</div>
        <Button
          label={copyLabel("img", "复制图片提示词")}
          variant="primary"
          onClick={() => doCopy("img", imagePrompt)}
        />
        <div style={boxStyle}>{imagePrompt}</div>
        <div style={smallLabel}>
          出图上传：图片1 = 主角上身实物；图片2 = 配角上身实物（异色，以你本次上传为准）。
        </div>

        <Divider />

        <div style={smallLabel} id="video">
          视频提示词 · {shotMeta.label}
        </div>
        <Segmented
          options={VID_MODELS}
          value={vidModel}
          onChange={(v: string) => {
            setVidModel(v === "kling" ? "kling" : "jimeng");
            setCopied((c) => (c === "vid" ? "" : c));
          }}
        />
        <Button
          label={copyLabel("vid", "复制" + vidName + "视频提示词")}
          variant="primary"
          onClick={() => doCopy("vid", videoPrompt)}
        />
        <div style={boxStyle}>{videoPrompt}</div>
        <div style={smallLabel}>
          视频上传：刚生成的定妆图作为@图片1（此说明不写入复制文本）。下装「
          {bottom.name}」· 发型「{look.name}」· {shotMeta.label}· 上衣色以定妆图实物为准。提示词按所选模型的官方写法生成，复制文本里不出现模型名。
        </div>
        {copied === "fail" ? (
          <Text>当前环境不允许自动复制，请长按选中文字后复制。</Text>
        ) : null}
      </Section>

      <Section heading="口播要点（写死 · 后期字幕）" id="copy">
        <Text>4句结构：无厘头钩子（可抽）→ KEY厚棉99多囤（写死）→ 离谱（写死）→ CTA点头像（写死）。双人主配一人一句轮流。字幕必须与视频提示词一致。</Text>
        <NumberedList items={copyLines.map((line) => ({ text: "（" + line.speaker + "）「" + line.text + "」" }))} />
        <Properties
          items={[
            {
              label: "必须打到",
              value: "4套钩子 · 官方旗舰店双十一 · 厚棉99一套 · 多囤几套 · 点头像进直播间",
            },
            {
              label: "时长",
              value:
                shotMode === "cuts"
                  ? "分镜4镜（" + videoDurBreakdown() + "）"
                  : "一镜到底 · 成片 " + String(VIDEO_SEC) + " 秒",
            },
          ]}
        />
      </Section>

      <Section heading="下装卡池（除牛仔裤）" id="bottoms">
        <Table
          columns={["下装", "气质", "写入提示词的描述"]}
          rows={BOTTOMS.map((b) => [b.name, b.vibe, b.line])}
        />
      </Section>

      <Section heading="场景卡池" id="scene">
        <Table
          columns={["场景", "场景备注", "调度摘要"]}
          rows={SCENES.map((s) => [s.name, s.hook, s.staging])}
        />
      </Section>

      <Section heading="后期" id="post">
        <Text>AI 画面零文字；底栏白字黑边，利益点亮黄；成片 {String(VIDEO_SEC)} 秒（按台词加权）；轻环境声即可。</Text>
        <Divider />
        <Text>定妆图先出，再出视频；脚不露；台词写死，字幕后期叠。</Text>
      </Section>
    </Page>
  );
}
