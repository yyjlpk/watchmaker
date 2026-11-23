(() => {
'use strict';

const DEVICE_PROFILES = {
  trex3pro48: {
    targetKey: 't-rex-3-pro-48mm',
    displayName: 'Amazfit T-Rex 3 Pro (48mm)',
    platforms: [
      { name: 't-rex-3-pro-48mm', deviceSource: 10551552 },
      { name: 't-rex-3-pro-48mm-wn', deviceSource: 10551553 },
      { name: 't-rex-3-pro-48mm-w', deviceSource: 10551555 }
    ],
    designWidth: 480
  },
  trex3pro44: {
    targetKey: 't-rex-3-pro-44mm',
    displayName: 'Amazfit T-Rex 3 Pro (44mm)',
    platforms: [
      { name: 't-rex-3-pro-44mm', deviceSource: 10682624 },
      { name: 't-rex-3-pro-44mm-wn', deviceSource: 10682625 },
      { name: 't-rex-3-pro-44mm-w', deviceSource: 10682627 }
    ],
    designWidth: 466
  },
  trex3: {
    targetKey: 't-rex-3',
    displayName: 'Amazfit T-Rex 3',
    platforms: [
      { name: "t-rex-3-8716544", deviceSource: 8716544 },
      { name: "t-rex-3-8716545", deviceSource: 8716545 },
      { name: "t-rex-3-8716547", deviceSource: 8716547 }
    ],
    designWidth: 480
  },
  trexultra: {
    targetKey: 't-rex-ultra',
    displayName: 'Amazfit T-Rex Ultra',
    platforms: [
      { name: "t-rex-ultra-6553856", deviceSource: 6553856 },
      { name: "t-rex-ultra-6553857", deviceSource: 6553857 }
    ],
    designWidth: 454
  },
  trex2: {
    targetKey: 't-rex-2',
    displayName: 'Amazfit T-Rex 2',
    platforms: [
      { name: 't-rex-2', deviceSource: 418 },
      { name: 't-rex-2-w', deviceSource: 419 }
    ],
    designWidth: 454
  },
  balance2: {
    targetKey: 'balance-2',
    displayName: 'Amazfit Balance 2',
    platforms: [
      { name: "balance-2-9568512", deviceSource: 9568512 },
      { name: "balance-2-9568513", deviceSource: 9568513 },
      { name: "balance-2-9568515", deviceSource: 9568515 }
    ],
    designWidth: 480
  },
  balance: {
    targetKey: 'balance',
    displayName: 'Amazfit Balance',
    platforms: [
      { name: "balance-8519936", deviceSource: 8519936 },
      { name: "balance-8519937", deviceSource: 8519937 },
      { name: "balance-8519939", deviceSource: 8519939 }
    ],
    designWidth: 480
  },
  active2: {
    targetKey: 'active-2-round',
    displayName: 'Amazfit Active 2 (Round)',
    platforms: [
      { name: "active-2-round-8913152", deviceSource: 8913152 },
      { name: "active-2-round-8913153", deviceSource: 8913153 },
      { name: "active-2-round-8913155", deviceSource: 8913155 },
      { name: "active-2-round-8913159", deviceSource: 8913159 },
      { name: "active-2-round-10092800", deviceSource: 10092800 },
      { name: "active-2-round-10092801", deviceSource: 10092801 },
      { name: "active-2-round-10092803", deviceSource: 10092803 },
      { name: "active-2-round-10092807", deviceSource: 10092807 }
    ],
    designWidth: 466
  },
  gtr4: {
    targetKey: 'gtr-4',
    displayName: 'Amazfit GTR 4',
    platforms: [
      { name: "gtr-4-7930112", deviceSource: 7930112 },
      { name: "gtr-4-7930113", deviceSource: 7930113 },
      { name: "gtr-4-7864577", deviceSource: 7864577 }
    ],
    designWidth: 466
  },
  gtr3pro: {
    photoOnly: true,
    targetKey: 'gtr-3-pro',
    displayName: 'Amazfit GTR 3 Pro',
    platforms: [
      { name: 'gtr-3-pro', deviceSource: 229 },
      { name: 'gtr-3-pro-w', deviceSource: 230 }
    ],
    designWidth: 480
  },
  gtr3: {
    photoOnly: true,
    targetKey: 'gtr-3',
    displayName: 'Amazfit GTR 3',
    platforms: [
      { name: 'gtr-3', deviceSource: 226 },
      { name: 'gtr-3-w', deviceSource: 227 }
    ],
    designWidth: 454
  },
  gtrmini: {
    targetKey: 'gtr-mini',
    displayName: 'Amazfit GTR Mini',
    platforms: [
      { name: "gtr-mini-250", deviceSource: 250 },
      { name: "gtr-mini-251", deviceSource: 251 }
    ],
    designWidth: 416
  },
  cheetahpro: {
    targetKey: 'cheetah-pro',
    displayName: 'Amazfit Cheetah Pro',
    platforms: [
      { name: "cheetah-pro-8126720", deviceSource: 8126720 },
      { name: "cheetah-pro-8126721", deviceSource: 8126721 }
    ],
    designWidth: 480
  },
  cheetah: {
    targetKey: 'cheetah-round',
    displayName: 'Amazfit Cheetah (Round)',
    platforms: [
      { name: "cheetah-round-8192256", deviceSource: 8192256 },
      { name: "cheetah-round-8192257", deviceSource: 8192257 }
    ],
    designWidth: 454
  },
  falcon: {
    targetKey: 'falcon',
    displayName: 'Amazfit Falcon',
    platforms: [
      { name: 'falcon', deviceSource: 414 },
      { name: 'falcon-w', deviceSource: 415 }
    ],
    designWidth: 416
  }
};

const ADDITIONAL_MODELS = {
  trexModels: [
    ['trexultra2', 't-rex-ultra-2', 'T-Rex Ultra 2', 480, 480, [10879232, 10879233, 10879235]]
  ],
  balanceActiveModels: [
    ['balance3', 'balance-3', 'Balance 3', 480, 480, [11141376, 11141377, 11141379]],
    ['balanceultra', 'balance-ultra', 'Balance Ultra', 480, 480, [11075840, 11075841]],
    ['active3premium', 'active-3-premium', 'Active 3 Premium', 466, 466, [10944768, 10944769, 10944771, 10948867]],
    ['activemax', 'active-max', 'Active Max', 480, 480, [10813697, 10813699]],
    ['activeedge', 'active-edge', 'Active Edge', 360, 360, [8388864, 8388865]]
  ],
  otherRoundModels: [
    ['cheetah2pro', 'cheetah-2-pro', 'Cheetah 2 Pro', 466, 466, [11010304, 11010305, 11010307]],
    ['cheetah2ultra', 'cheetah-2-ultra', 'Cheetah 2 Ultra', 480, 480, [9961728, 9961729], true]
  ],
  squareModels: [
    ['active', 'active', 'Active', 390, 450, [8323328, 8323329]],
    ['active2square', 'active-2-square', 'Active 2 (Square)', 390, 450, [10223872, 10223873, 10223875]],
    ['bipmax', 'bip-max', 'Bip Max', 432, 514, [11206915]],
    ['bip6', 'bip-6', 'Bip 6', 390, 450, [9765120, 9765121, 10158337]],
    ['bip5unity', 'bip-5-unity', 'Bip 5 Unity', 320, 380, [8782081, 8782088, 8782089]],
    ['bip5', 'bip-5', 'Bip 5', 320, 380, [8454400, 8454401]],
    ['cheetahsquare', 'cheetah-square', 'Cheetah (Square)', 390, 450, [8257793]],
    ['gts4', 'gts-4', 'GTS 4', 390, 450, [7995648, 7995649]],
    ['gts4mini', 'gts-4-mini', 'GTS 4 mini', 336, 384, [246, 247], true],
    ['gts3', 'gts-3', 'GTS 3', 390, 450, [224, 225], true]
  ]
};

for (const models of Object.values(ADDITIONAL_MODELS)) {
  for (const [key, targetKey, name, designWidth, designHeight, ids, photoOnly] of models) {
    DEVICE_PROFILES[key] = {
      targetKey, displayName: 'Amazfit ' + name, designWidth, designHeight, photoOnly,
      platforms: ids.map(deviceSource => ({ deviceSource }))
    };
  }
}

function getExportMetrics(state, targetSize = 480) {
  const S = targetSize / 480;
  const getScale = (id) => {
    const w = state.widgets.find(item => item.id === id);
    return w && w.scale ? w.scale : 1;
  };
  const digS = getScale('digital') * S;
  const wkS = getScale('weekWeather');
  const curS = getScale('weather');
  const weatherIconBase = (state.widgets.find(w => w.id === 'weekWeather')?.visible ? wkS : curS) * S;

  return {
    S,
    digS,
    mainW: Math.max(18, Math.round(36 * digS)),
    mainH: Math.max(32, Math.round(66 * digS)),
    mainFs: Math.max(24, Math.round(56 * digS)),
    colonW: Math.max(8, Math.round(16 * digS)),
    colonFs: Math.max(22, Math.round(52 * digS)),
    secW: Math.max(10, Math.round(16 * digS)),
    secH: Math.max(16, Math.round(30 * digS)),
    secFs: Math.max(12, Math.round(24 * digS)),
    wIcon: Math.max(12, Math.round(22 * weatherIconBase)),
    icSteps: Math.max(12, Math.round(20 * getScale('steps') * S)),
    icHeart: Math.max(12, Math.round(20 * getScale('heart') * S)),
    icVo2: Math.max(12, Math.round(20 * getScale('vo2max') * S)),
    icBat: Math.max(12, Math.round(20 * getScale('battery') * S)),
    icSun: Math.max(12, Math.round(20 * getScale('sunTimes') * S))
  };
}

function buildWatchfaceIndexJs(dev, state) {
  const dw = state.widgets.find(w => w.id === 'date');
  const dig = state.widgets.find(w => w.id === 'digital');
  const ana = state.widgets.find(w => w.id === 'analog');
  const wkW = state.widgets.find(w => w.id === 'weekWeather');
  const curW = state.widgets.find(w => w.id === 'weather');
  const sun = state.widgets.find(w => w.id === 'sunTimes');
  const steps = state.widgets.find(w => w.id === 'steps');
  const heart = state.widgets.find(w => w.id === 'heart');
  const vo2 = state.widgets.find(w => w.id === 'vo2max');
  const bat = state.widgets.find(w => w.id === 'battery');
  const M = getExportMetrics(state, dev.designWidth);
  const S = M.S;
  const height = dev.designHeight ?? dev.designWidth;
  const verticalOffset = (height - dev.designWidth) / 2;
  const sc = (v) => Math.round(v * S);
  const scY = (v) => Math.round(v * S + verticalOffset);
  const scW = (v, w) => Math.round(v * (w?.scale || 1) * S);
  const hexToNum = (hex) => '0x' + (hex || '#ffffff').replace('#', '');

  return `// Zepp OS 3.0 / 4.0+ 정식 모듈 기반 Watchface (${dev.displayName})
import { createWidget, widget, align, prop, show_level } from '@zos/ui';
import { Time, Step, HeartRate, Battery, Weather } from '@zos/sensor';

const DIGIT_ARR = [${Array.from({ length: 10 }, (_, i) => `'main-${i}.png'`).join(', ')}];
const SEC_ARR   = [${Array.from({ length: 10 }, (_, i) => `'sec-${i}.png'`).join(', ')}];
const NORMAL = show_level.ONLY_NORMAL;
const AOD = show_level.ONAL_AOD || show_level.ONLY_AOD || 2;
const BOTH = NORMAL | AOD;

// Zepp OS 날씨 코드 -> 아이콘 파일명 매핑
function getWeatherIcon(idx) {
  if (idx === 0 || idx === 22) return 'w-sun.png';
  if (idx === 1 || idx === 2) return 'w-partly.png';
  if (idx === 3 || idx === 4 || idx === 19 || idx === 20 || idx === 21) return 'w-cloud.png';
  if ((idx >= 5 && idx <= 11) || idx === 23) return 'w-rain.png';
  if (idx >= 12 && idx <= 18) return 'w-snow.png';
  return 'w-partly.png';
}

WatchFace({
  build() {
// 1. 일반 / 절전(AOD) 배경
try {
  createWidget(widget.IMG, {
    x: 0, y: 0, w: ${dev.designWidth}, h: ${height}, src: 'background.png',
    show_level: NORMAL
  });
  createWidget(widget.IMG, {
    x: 0, y: 0, w: ${dev.designWidth}, h: ${height}, src: 'aod-background.png',
    show_level: AOD
  });
} catch (e) {}

// 2. 큰 디지털 시계 (사용자가 조절한 크기 scale + 콜론 + 하늘색 초 표시)
${dig && dig.visible ? `try {
  const centerX = ${sc(dig.x)} - ${state.showSeconds ? scW(18, dig) : 0};
  const baseY = ${Math.max(0, scY(dig.y) - Math.round(M.mainH / 2))};
  const colonX = centerX - ${Math.round(M.colonW / 2)};
  const hourX = colonX - ${M.mainW * 2} - ${Math.max(1, Math.round(2 * M.digS))};
  const minX = colonX + ${M.colonW} + ${Math.max(1, Math.round(2 * M.digS))};
  createWidget(widget.IMG_TIME, {
    hour_startX: hourX,
    hour_startY: baseY,
    hour_array: DIGIT_ARR,
    hour_zero: 1,
    minute_startX: minX,
    minute_startY: baseY,
    minute_array: DIGIT_ARR,
    minute_zero: 1,
    show_level: BOTH
  });
  createWidget(widget.IMG, {
    x: colonX,
    y: baseY,
    src: 'main-colon.png',
    show_level: BOTH
  });
  ${state.showSeconds ? `
  createWidget(widget.IMG_TIME, {
    second_startX: minX + ${M.mainW * 2} + ${Math.max(4, Math.round(8 * M.digS))},
    second_startY: baseY + ${Math.max(0, M.mainH - M.secH - Math.round(4 * M.digS))},
    second_array: SEC_ARR,
    second_zero: 1,
    show_level: NORMAL
  });` : ''}
} catch (e) {}` : ''}

// 3. 아날로그 바늘
${ana && ana.visible ? `try {
  createWidget(widget.TIME_POINTER, {
    hour_centerX: ${sc(ana.x)}, hour_centerY: ${scY(ana.y)}, hour_posX: 40, hour_posY: ${Math.round(dev.designWidth / 2)}, hour_path: 'h01.png',
    minute_centerX: ${sc(ana.x)}, minute_centerY: ${scY(ana.y)}, minute_posX: 40, minute_posY: ${Math.round(dev.designWidth / 2)}, minute_path: 'm01.png',
    second_centerX: ${sc(ana.x)}, second_centerY: ${scY(ana.y)}, second_posX: 40, second_posY: ${Math.round(dev.designWidth / 2)}, second_path: 's01.png',
    show_level: NORMAL
  });
} catch (e) {}` : ''}

// 4. 풀 날짜 (둥근 박스 + 크기 scale 반영 + 요일만 주말 색깔 분리)
${dw && dw.visible ? `try {
  this.timeSensor = new Time();
  const pad = (n) => (n < 10 ? '0' + n : '' + n);
  const weeks = ${state.dateOpt.style === 'en_iso'
    ? `['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']`
    : state.dateOpt.style === 'full_kr' || state.dateOpt.style === 'two_line'
      ? `['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']`
      : `['(일)', '(월)', '(화)', '(수)', '(목)', '(금)', '(토)']`};
  const isTwoLine = ${state.dateOpt.style === 'two_line'};
  const boxW = ${scW(state.dateOpt.style === 'full_kr' ? 256 : 210, dw)};
  const boxH = ${scW(state.dateOpt.style === 'two_line' ? 50 : 36, dw)};
  const boxX = ${sc(dw.x)} - Math.round(boxW / 2);
  const boxY = ${scY(dw.y)} - Math.round(boxH / 2);

  ${state.dateOpt.boxStyle === 'pill' ? `
  createWidget(widget.FILL_RECT, {
    x: boxX, y: boxY, w: boxW, h: boxH,
    radius: Math.round(boxH / 2),
    color: 0x0f172a, alpha: 165,
    show_level: NORMAL
  });
  createWidget(widget.STROKE_RECT, {
    x: boxX, y: boxY, w: boxW, h: boxH,
    radius: Math.round(boxH / 2),
    line_width: 2,
    color: 0x475569,
    show_level: NORMAL
  });` : ''}

  const fs = ${Math.max(12, scW(state.dateOpt.fontSize + 1, dw))};
  const mainRatio = ${state.dateOpt.style === 'full_kr' ? 0.65 : 0.64};
  const dateMainWidget = createWidget(widget.TEXT, {
    x: isTwoLine ? boxX : (boxX + 4),
    y: isTwoLine ? (boxY + 2) : boxY,
    w: isTwoLine ? boxW : (${state.dateOpt.showWeekday ? 'Math.round(boxW * mainRatio)' : 'boxW - 8'}),
    h: isTwoLine ? Math.round(boxH / 2) : boxH,
    color: ${hexToNum(dw.color)},
    text_size: fs,
    align_h: (isTwoLine || !${state.dateOpt.showWeekday}) ? align.CENTER_H : align.RIGHT,
    align_v: align.CENTER_V,
    text: '',
    show_level: BOTH
  });
  ${state.dateOpt.showWeekday ? `
  const dateWeekWidget = createWidget(widget.TEXT, {
    x: isTwoLine ? boxX : (boxX + 10 + Math.round(boxW * mainRatio)),
    y: isTwoLine ? (boxY + Math.round(boxH / 2) - 2) : boxY,
    w: isTwoLine ? boxW : Math.round(boxW * (1 - mainRatio) - 10),
    h: isTwoLine ? Math.round(boxH / 2) : boxH,
    color: ${hexToNum(dw.color)},
    text_size: isTwoLine ? Math.max(11, fs - 1) : fs,
    align_h: isTwoLine ? align.CENTER_H : align.LEFT,
    align_v: align.CENTER_V,
    text: '',
    show_level: BOTH
  });` : ''}

  this.updateDate = () => {
    const y = this.timeSensor.getFullYear();
    const m = this.timeSensor.getMonth();
    const d = this.timeSensor.getDate();
    const wIdx = this.timeSensor.getDay() % 7;
    const yPart = ${state.dateOpt.showYear ? (state.dateOpt.style === 'full_kr' ? `y + '년 '` : state.dateOpt.style === 'en_iso' ? `y + '-'` : `y + '.'`) : `''`};
    const mdPart = ${state.dateOpt.style === 'full_kr' ? `m + '월 ' + d + '일'` : state.dateOpt.style === 'en_iso' ? `pad(m) + '-' + pad(d)` : `pad(m) + '.' + pad(d)`};
    dateMainWidget.setProperty(prop.TEXT, yPart + mdPart);
    ${state.dateOpt.showWeekday ? `
    dateWeekWidget.setProperty(prop.TEXT, weeks[wIdx]);
    ${state.dateOpt.weekendColor ? `
    const col = wIdx === 0 ? 0xfb7185 : (wIdx === 6 ? 0x38bdf8 : ${hexToNum(dw.color)});
    dateWeekWidget.setProperty(prop.COLOR, col);` : ''}` : ''}
  };
  this.updateDate();
  this.timeSensor.onPerMinute(this.updateDate);
} catch (e) {}` : ''}

// 5. 날씨 (1주일 요일별 카드 + 오늘 날씨 + 일출·일몰 크기 scale 반영)
${(wkW && wkW.visible) || (curW && curW.visible) || (sun && sun.visible) ? `try {
  const weatherSensor = new Weather();
  const forecast = weatherSensor.getForecast();
  const pad2 = (n) => (n < 10 ? '0' + n : '' + n);
  ${wkW && wkW.visible ? `
  const tNow = new Time();
  const baseDow = tNow.getDay() % 7;
  const dNames = ['일', '월', '화', '수', '목', '금', '토'];
  const fList = (forecast && forecast.forecastData && forecast.forecastData.data) || [];
  const cardW = ${Math.max(26, scW(44, wkW))};
  const gap = ${Math.max(2, scW(4, wkW))};
  const totalW = cardW * 7 + gap * 6;
  const startX = ${sc(wkW.x)} - Math.round(totalW / 2);
  const cardH = ${Math.max(38, scW(62, wkW))};
  const cardY = ${Math.max(0, scY(wkW.y) - Math.round(Math.max(38, scW(62, wkW)) / 2))};
  for (let i = 0; i < 7; i++) {
    const cx = startX + i * (cardW + gap);
    const dIdx = (baseDow + i) % 7;
    const item = fList[i];
    const tempStr = item && typeof item.high === 'number' ? (item.high + '°') : '--°';
    const iconSrc = getWeatherIcon(item && typeof item.index === 'number' ? item.index : 1);

    createWidget(widget.FILL_RECT, {
      x: cx, y: cardY, w: cardW, h: cardH, radius: ${Math.max(6, scW(10, wkW))},
      color: i === 0 ? 0x0284c7 : 0x0f172a,
      alpha: i === 0 ? 95 : 155,
      show_level: NORMAL
    });
    createWidget(widget.STROKE_RECT, {
      x: cx, y: cardY, w: cardW, h: cardH, radius: ${Math.max(6, scW(10, wkW))},
      line_width: 1,
      color: i === 0 ? 0x38bdf8 : 0x334155,
      show_level: NORMAL
    });
    createWidget(widget.TEXT, {
      x: cx, y: cardY + 2, w: cardW, h: ${Math.max(12, scW(18, wkW))},
      color: dIdx === 0 ? 0xfb7185 : (dIdx === 6 ? 0x38bdf8 : 0xcbd5e1),
      text_size: ${Math.max(10, scW(13, wkW))}, align_h: align.CENTER_H,
      text: dNames[dIdx], show_level: NORMAL
    });
    createWidget(widget.IMG, {
      x: cx + Math.round((cardW - ${M.wIcon}) / 2), y: cardY + Math.round((cardH - ${M.wIcon}) / 2),
      w: ${M.wIcon}, h: ${M.wIcon}, src: iconSrc, show_level: NORMAL
    });
    createWidget(widget.TEXT, {
      x: cx, y: cardY + cardH - ${Math.max(13, scW(20, wkW))}, w: cardW, h: ${Math.max(12, scW(18, wkW))},
      color: ${hexToNum(wkW.color)},
      text_size: ${Math.max(10, scW(13, wkW))}, align_h: align.CENTER_H,
      text: tempStr, show_level: NORMAL
    });
  }` : ''}
  ${curW && curW.visible ? `
  const f0 = forecast && forecast.forecastData && forecast.forecastData.data && forecast.forecastData.data[0];
  const curStr = f0 ? (f0.high + '° / ' + f0.low + '°') : '--°C';
  createWidget(widget.IMG, {
    x: ${Math.max(0, sc(curW.x) - scW(62, curW))}, y: ${Math.max(0, scY(curW.y) - Math.round(M.wIcon / 2))},
    w: ${M.wIcon}, h: ${M.wIcon}, src: getWeatherIcon(f0 ? f0.index : 0), show_level: NORMAL
  });
  createWidget(widget.TEXT, {
    x: ${Math.max(0, sc(curW.x) - scW(36, curW))}, y: ${Math.max(0, scY(curW.y) - scW(14, curW))},
    w: ${scW(116, curW)}, h: ${scW(28, curW)}, color: ${hexToNum(curW.color)},
    text_size: ${Math.max(12, scW(19, curW))}, align_h: align.LEFT, align_v: align.CENTER_V,
    text: curStr, show_level: NORMAL
  });` : ''}
  ${sun && sun.visible ? `
  const tide = forecast && forecast.tideData && forecast.tideData.data && forecast.tideData.data[0];
  const srTxt = tide?.sunrise ? (pad2(tide.sunrise.hour) + ':' + pad2(tide.sunrise.minute)) : '--:--';
  const ssTxt = tide?.sunset ? (pad2(tide.sunset.hour) + ':' + pad2(tide.sunset.minute)) : '--:--';
  createWidget(widget.IMG, {
    x: ${Math.max(0, sc(sun.x) - scW(90, sun))}, y: ${Math.max(0, scY(sun.y) - Math.round(M.icSun / 2))},
    w: ${M.icSun}, h: ${M.icSun}, src: 'ic-sunrise.png', show_level: NORMAL
  });
  createWidget(widget.TEXT, {
    x: ${Math.max(0, sc(sun.x) - scW(66, sun))}, y: ${Math.max(0, scY(sun.y) - scW(14, sun))},
    w: ${scW(68, sun)}, h: ${scW(28, sun)}, color: ${hexToNum(sun.color)},
    text_size: ${Math.max(11, scW(17, sun))}, align_h: align.LEFT, align_v: align.CENTER_V,
    text: srTxt, show_level: NORMAL
  });
  createWidget(widget.IMG, {
    x: ${Math.max(0, sc(sun.x) + scW(12, sun))}, y: ${Math.max(0, scY(sun.y) - Math.round(M.icSun / 2))},
    w: ${M.icSun}, h: ${M.icSun}, src: 'ic-sunset.png', show_level: NORMAL
  });
  createWidget(widget.TEXT, {
    x: ${Math.max(0, sc(sun.x) + scW(36, sun))}, y: ${Math.max(0, scY(sun.y) - scW(14, sun))},
    w: ${scW(68, sun)}, h: ${scW(28, sun)}, color: ${hexToNum(sun.color)},
    text_size: ${Math.max(11, scW(17, sun))}, align_h: align.LEFT, align_v: align.CENTER_V,
    text: ssTxt, show_level: NORMAL
  });` : ''}
} catch (e) {}` : ''}

// 6. 걸음 수 (아이콘 + 숫자 크기 scale 반영)
${steps && steps.visible ? `try {
  this.stepSensor = new Step();
  createWidget(widget.IMG, {
    x: ${Math.max(0, sc(steps.x) - scW(44, steps))}, y: ${Math.max(0, scY(steps.y) - Math.round(M.icSteps / 2))},
    w: ${M.icSteps}, h: ${M.icSteps}, src: 'ic-steps.png', show_level: NORMAL
  });
  const stepText = createWidget(widget.TEXT, {
    x: ${Math.max(0, sc(steps.x) - scW(20, steps))}, y: ${Math.max(0, scY(steps.y) - scW(14, steps))},
    w: ${scW(88, steps)}, h: ${scW(28, steps)}, color: ${hexToNum(steps.color)},
    text_size: ${Math.max(12, scW(19, steps))}, align_h: align.LEFT, align_v: align.CENTER_V,
    text: String(this.stepSensor.getCurrent() || 0), show_level: NORMAL
  });
  this.onStepChange = () => stepText.setProperty(prop.TEXT, String(this.stepSensor.getCurrent() || 0));
  this.stepSensor.onChange(this.onStepChange);
} catch (e) {}` : ''}

// 7. 심박수 (하트 아이콘 + 숫자 크기 scale 반영)
${heart && heart.visible ? `try {
  this.hrSensor = new HeartRate();
  createWidget(widget.IMG, {
    x: ${Math.max(0, sc(heart.x) - scW(32, heart))}, y: ${Math.max(0, scY(heart.y) - Math.round(M.icHeart / 2))},
    w: ${M.icHeart}, h: ${M.icHeart}, src: 'ic-heart.png', show_level: NORMAL
  });
  const hrText = createWidget(widget.TEXT, {
    x: ${Math.max(0, sc(heart.x) - scW(8, heart))}, y: ${Math.max(0, scY(heart.y) - scW(14, heart))},
    w: ${scW(62, heart)}, h: ${scW(28, heart)}, color: ${hexToNum(heart.color)},
    text_size: ${Math.max(12, scW(19, heart))}, align_h: align.LEFT, align_v: align.CENTER_V,
    text: String(this.hrSensor.getLast() || this.hrSensor.getCurrent() || '--'), show_level: NORMAL
  });
  this.onHrChange = () => hrText.setProperty(prop.TEXT, String(this.hrSensor.getCurrent() || this.hrSensor.getLast() || '--'));
  this.hrSensor.onCurrentChange(this.onHrChange);
} catch (e) {}` : ''}

// 8. VO2max (아이콘 + 수치 크기 scale 반영)
${vo2 && vo2.visible ? `try {
  createWidget(widget.IMG, {
    x: ${Math.max(0, sc(vo2.x) - scW(48, vo2))}, y: ${Math.max(0, sc(vo2.y) - Math.round(M.icVo2 / 2))},
    w: ${M.icVo2}, h: ${M.icVo2}, src: 'ic-vo2.png', show_level: NORMAL
  });
  createWidget(widget.TEXT, {
    x: ${Math.max(0, sc(vo2.x) - scW(24, vo2))}, y: ${Math.max(0, sc(vo2.y) - scW(14, vo2))},
    w: ${scW(90, vo2)}, h: ${scW(28, vo2)}, color: ${hexToNum(vo2.color)},
    text_size: ${Math.max(11, scW(17, vo2))}, align_h: align.LEFT, align_v: align.CENTER_V,
    text: 'VO2 --', show_level: NORMAL
  });
} catch (e) {}` : ''}

// 9. 배터리 (배터리 아이콘 + % 크기 scale 반영)
${bat && bat.visible ? `try {
  this.batSensor = new Battery();
  createWidget(widget.IMG, {
    x: ${Math.max(0, sc(bat.x) - scW(38, bat))}, y: ${Math.max(0, scY(bat.y) - Math.round(M.icBat / 2))},
    w: ${M.icBat}, h: ${M.icBat}, src: 'ic-bat.png', show_level: NORMAL
  });
  const batText = createWidget(widget.TEXT, {
    x: ${Math.max(0, sc(bat.x) - scW(14, bat))}, y: ${Math.max(0, scY(bat.y) - scW(14, bat))},
    w: ${scW(68, bat)}, h: ${scW(28, bat)}, color: ${hexToNum(bat.color)},
    text_size: ${Math.max(12, scW(19, bat))}, align_h: align.LEFT, align_v: align.CENTER_V,
    text: (this.batSensor.getCurrent() || 0) + '%', show_level: NORMAL
  });
  this.onBatChange = () => batText.setProperty(prop.TEXT, (this.batSensor.getCurrent() || 0) + '%');
  this.batSensor.onChange(this.onBatChange);
} catch (e) {}` : ''}
  },

  onDestroy() {
try {
  if (this.timeSensor && this.updateDate) this.timeSensor.offPerMinute(this.updateDate);
  if (this.stepSensor && this.onStepChange) this.stepSensor.offChange(this.onStepChange);
  if (this.hrSensor && this.onHrChange) this.hrSensor.offCurrentChange(this.onHrChange);
  if (this.batSensor && this.onBatChange) this.batSensor.offChange(this.onBatChange);
} catch (e) {}
  }
});
`;
}

globalThis.WatchmakerProject = {
  profiles: DEVICE_PROFILES,
  additionalModels: ADDITIONAL_MODELS,
  getExportMetrics,
  buildWatchfaceIndexJs,
};
})();
