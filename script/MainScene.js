"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var Config_1 = require("./Config");
var Button_1 = require("./Button");
var MainScene = /** @class */ (function (_super) {
    __extends(MainScene, _super);
    function MainScene(param) {
        var _this = this;
        param.assetIds = [
            "img_numbers_n", "img_numbers_n_red", "title", "start", "finish", "combo", "waku", "score", "time",
            "config", "volume", "test", "glyph72", "number_p", "number_b",
            "panel",
            "se_start", "se_timeup", "move", "bgm", "clear"
        ];
        _this = _super.call(this, param) || this;
        var tl = require("@akashic-extension/akashic-timeline");
        var timeline = new tl.Timeline(_this);
        var timeline2 = new tl.Timeline(_this);
        _this.loaded.add(function () {
            g.game.vars.gameState = { score: 0 };
            var size = 280;
            var panelNumX = 4;
            var panelNumY = 4;
            var panelSize = size / panelNumY;
            var margin = 40;
            var isDebug = false; //デバッグ用必ずfalseに
            // 何も送られてこない時は、標準の乱数生成器を使う
            var random = g.game.random;
            var isStart = false;
            _this.message.add(function (msg) {
                if (msg.data && msg.data.type === "start" && msg.data.parameters) {
                    var sessionParameters = msg.data.parameters;
                    if (sessionParameters.randomSeed != null) {
                        // プレイヤー間で共通の乱数生成器を生成
                        // `g.XorshiftRandomGenerator` は Akashic Engine の提供する乱数生成器実装で、 `g.game.random` と同じ型。
                        random = new g.XorshiftRandomGenerator(sessionParameters.randomSeed);
                    }
                }
            });
            // 配信者のIDを取得
            _this.lastJoinedPlayerId = "";
            g.game.join.add(function (ev) {
                _this.lastJoinedPlayerId = ev.player.id;
            });
            // 背景
            var bg = new g.FilledRect({ scene: _this, width: 640, height: 360, cssColor: "green", opacity: 0 });
            _this.append(bg);
            if ((typeof window !== "undefined" && window.RPGAtsumaru) || isDebug) {
                bg.opacity = 1.0;
                bg.modified();
            }
            var base = new g.Pane({ scene: _this, x: margin + 50, y: margin, width: size, height: size });
            _this.append(base);
            base.hide();
            var waku = new g.Sprite({ scene: _this, src: _this.assets["waku"], x: 49, y: -1 });
            _this.append(waku);
            waku.hide();
            var uiBase = new g.E({ scene: _this });
            _this.append(uiBase);
            uiBase.hide();
            //タイトル
            var sprTitle = new g.Sprite({ scene: _this, src: _this.assets["title"], x: 70 });
            _this.append(sprTitle);
            timeline.create(sprTitle, {
                modified: sprTitle.modified, destroyd: sprTitle.destroyed
            }).wait(5000).moveBy(-800, 0, 200).call(function () {
                bg.show();
                waku.show();
                base.show();
                uiBase.show();
                isStart = true;
                reset();
            });
            //フォント生成
            var glyph = JSON.parse(_this.assets["test"].data);
            var numFont = new g.BitmapFont({
                src: _this.assets["img_numbers_n"],
                map: glyph.map,
                defaultGlyphWidth: glyph.width,
                defaultGlyphHeight: glyph.height,
                missingGlyph: glyph.missingGlyph
            });
            var numFontRed = new g.BitmapFont({
                src: _this.assets["img_numbers_n_red"],
                map: glyph.map,
                defaultGlyphWidth: glyph.width,
                defaultGlyphHeight: glyph.height,
                missingGlyph: glyph.missingGlyph
            });
            glyph = JSON.parse(_this.assets["glyph72"].data);
            var numFontP = new g.BitmapFont({
                src: _this.assets["number_p"],
                map: glyph.map,
                defaultGlyphWidth: 72,
                defaultGlyphHeight: 80
            });
            glyph = JSON.parse(_this.assets["glyph72"].data);
            var numFontB = new g.BitmapFont({
                src: _this.assets["number_b"],
                map: glyph.map,
                defaultGlyphWidth: 72,
                defaultGlyphHeight: 80
            });
            //スコア
            uiBase.append(new g.Sprite({ scene: _this, src: _this.assets["score"], x: 450, y: 6 }));
            var score = 0;
            var labelScore = new g.Label({
                scene: _this,
                x: 440,
                y: 45,
                width: 32 * 6,
                fontSize: 32,
                font: numFont,
                text: "0P",
                textAlign: g.TextAlign.Right, widthAutoAdjust: false
            });
            uiBase.append(labelScore);
            var labelScorePlus = new g.Label({
                scene: _this,
                x: 440,
                y: 80,
                width: 32 * 6,
                fontSize: 32,
                font: numFontRed,
                text: "+1000",
                textAlign: g.TextAlign.Right, widthAutoAdjust: false
            });
            uiBase.append(labelScorePlus);
            //同時消し表示
            var labelCombo = new g.Label({ scene: _this, font: numFontB, fontSize: 72, text: "4", x: 420, y: 120 });
            uiBase.append(labelCombo);
            var sprCombo = new g.Sprite({ scene: _this, src: _this.assets["combo"], x: 70, y: 20, width: 135, height: 50 });
            labelCombo.append(sprCombo);
            //連鎖表示
            var labelRen = new g.Label({ scene: _this, font: numFontP, fontSize: 72, text: "4", x: 420, y: 200 });
            uiBase.append(labelRen);
            var sprRen = new g.Sprite({ scene: _this, src: _this.assets["combo"], x: 90, y: 20, width: 135, height: 50, srcY: 50 });
            labelRen.append(sprRen);
            //タイム
            uiBase.append(new g.Sprite({ scene: _this, src: _this.assets["time"], x: 540, y: 320 }));
            var labelTime = new g.Label({ scene: _this, font: numFont, fontSize: 32, text: "70", x: 580, y: 323 });
            uiBase.append(labelTime);
            //開始
            var sprStart = new g.Sprite({ scene: _this, src: _this.assets["start"], x: 50, y: 100 });
            uiBase.append(sprStart);
            sprStart.hide();
            //終了
            var finishBase = new g.E({ scene: _this, x: 0, y: 0 });
            _this.append(finishBase);
            finishBase.hide();
            var finishBg = new g.FilledRect({ scene: _this, width: 640, height: 360, cssColor: "#000000", opacity: 0.3 });
            finishBase.append(finishBg);
            var sprFinish = new g.Sprite({ scene: _this, src: _this.assets["finish"], x: 120, y: 100 });
            finishBase.append(sprFinish);
            //最前面
            var fg = new g.FilledRect({ scene: _this, width: 640, height: 480, cssColor: "#ff0000", opacity: 0.0 });
            _this.append(fg);
            //リセットボタン
            var btnReset = new Button_1.Button(_this, ["リセット"], 500, 270, 130);
            if ((typeof window !== "undefined" && window.RPGAtsumaru) || isDebug) {
                finishBase.append(btnReset);
                btnReset.pushEvent = function () {
                    reset();
                };
            }
            //ランキングボタン
            var btnRanking = new Button_1.Button(_this, ["ランキング"], 500, 200, 130);
            if ((typeof window !== "undefined" && window.RPGAtsumaru) || isDebug) {
                finishBase.append(btnRanking);
                btnRanking.pushEvent = function () {
                    window.RPGAtsumaru.experimental.scoreboards.display(1);
                };
            }
            //設定ボタン
            var btnConfig = new g.Sprite({ scene: _this, x: 600, y: 0, src: _this.assets["config"], touchable: true });
            if ((typeof window !== "undefined" && window.RPGAtsumaru) || isDebug) {
                _this.append(btnConfig);
            }
            //設定画面
            var config = new Config_1.Config(_this, 380, 40);
            if ((typeof window !== "undefined" && window.RPGAtsumaru) || isDebug) {
                _this.append(config);
            }
            config.hide();
            btnConfig.pointDown.add(function () {
                if (config.state & 1) {
                    config.show();
                }
                else {
                    config.hide();
                }
            });
            config.bgmEvent = function (num) {
                bgm.changeVolume(0.5 * num);
            };
            config.colorEvent = function (str) {
                bg.cssColor = str;
                bg.modified();
            };
            var playSound = function (name) {
                _this.assets[name].play().changeVolume(config.volumes[1]);
            };
            var bgm = _this.assets["bgm"].play();
            bgm.changeVolume(0.2);
            //スコア加算表示
            var bkTweenScore;
            var addScore = function (num) {
                if (score + num < 0) {
                    num = -score;
                }
                score += num;
                timeline.create().every(function (e, p) {
                    labelScore.text = "" + (score - Math.floor(num * (1 - p))) + "P";
                    labelScore.invalidate();
                }, 400);
                labelScorePlus.text = "+" + num;
                labelScorePlus.invalidate();
                if (bkTweenScore)
                    timeline2.remove(bkTweenScore);
                bkTweenScore = timeline2.create().every(function (e, p) {
                    labelScorePlus.opacity = p;
                    labelScorePlus.modified();
                }, 100).wait(4000).call(function () {
                    labelScorePlus.opacity = 0;
                    labelScorePlus.modified();
                });
                g.game.vars.gameState.score = score;
            };
            //パネルの土台
            var maps = [];
            var mapX = 0;
            var mapY = 0;
            var moveState = -1;
            var waitTime = 400;
            var moveTime = 100;
            var isMoveing = false;
            var isPush = false;
            var _loop_1 = function (y) {
                maps.push([]);
                var _loop_2 = function (x) {
                    var spr = new Map({
                        scene: _this,
                        x: panelSize * x,
                        y: panelSize * (panelNumY - y - 1),
                        width: panelSize,
                        height: panelSize,
                        cssColor: ((x + y) % 2) === 0 ? "#00AA00" : "green",
                        touchable: true,
                        opacity: 0.8
                    });
                    base.append(spr);
                    maps[y].push(spr);
                    //押したとき
                    spr.pointDown.add(function (ev) {
                        if (!isStart)
                            return;
                        if (isMoveing)
                            return;
                        sprSelectX.y = spr.y;
                        sprSelectX.modified();
                        sprSelectX.show();
                        sprSelectY.x = spr.x;
                        sprSelectY.modified();
                        sprSelectY.show();
                        isPush = true;
                        //画面外にドラッグして離されたとき
                        if (moveState !== -1) {
                            moveXPanels.forEach(function (e) { return e.hide(); });
                            panels.forEach(function (e) { return e.show(); });
                            moveState = -1;
                        }
                    });
                    //移動
                    spr.pointMove.add(function (ev) {
                        if (!isPush || !isStart)
                            return;
                        var mx = ev.startDelta.x;
                        var my = ev.startDelta.y;
                        //移動方向を決める
                        if (moveState === -1) {
                            var limit = 20;
                            if (mx < -limit || mx > limit) {
                                moveState = 0;
                                sprSelectY.hide();
                                for (var xx = 0; xx < mapX; xx++) {
                                    panels[maps[y][xx].num].hide();
                                }
                                //移動用
                                for (var xx = 0; xx < mapX + 2; xx++) {
                                    moveXPanels[xx].y = spr.y;
                                    moveXPanels[xx].x = (xx - 1) * panelSize;
                                    var num = maps[y][(xx - 1 + mapX) % mapX].num;
                                    moveXPanels[xx].setNum(panels[num].num);
                                    moveXPanels[xx].show();
                                }
                            }
                            else if (my < -limit || my > limit) {
                                moveState = 1;
                                sprSelectX.hide();
                                for (var yy = 0; yy < mapY; yy++) {
                                    panels[maps[yy][x].num].hide();
                                }
                                //移動用
                                for (var yy = 0; yy < mapY + 2; yy++) {
                                    moveXPanels[yy].y = (mapY - yy) * panelSize;
                                    moveXPanels[yy].x = spr.x;
                                    var num = maps[(yy - 1 + mapY) % mapY][x].num;
                                    moveXPanels[yy].setNum(panels[num].num);
                                    moveXPanels[yy].show();
                                }
                            }
                        }
                        if (moveState === 0) {
                            //移動用
                            for (var xx = 0; xx < mapX + 2; xx++) {
                                moveXPanels[xx].x = (xx - 1) * panelSize + (mx % panelSize);
                                var j = mx >= 0 ? Math.floor(mx / panelSize) : Math.ceil(mx / panelSize);
                                var i = mapX - (j % mapX);
                                var num = maps[y][(xx - 1 + mapX + i) % mapX].num;
                                moveXPanels[xx].setNum(panels[num].num);
                                moveXPanels[xx].show();
                            }
                        }
                        if (moveState === 1) {
                            //移動用
                            for (var yy = 0; yy < mapY + 2; yy++) {
                                moveXPanels[yy].y = (mapY - yy) * panelSize + (my % panelSize);
                                var j = -my >= 0 ? Math.floor(-my / panelSize) : Math.ceil(-my / panelSize);
                                var i = mapY - (j % mapY);
                                var num = maps[(yy - 1 + mapY + i) % mapY][x].num;
                                moveXPanels[yy].setNum(panels[num].num);
                                moveXPanels[yy].show();
                            }
                        }
                    });
                    //離したとき
                    spr.pointUp.add(function (ev) {
                        if (!isPush || !isStart)
                            return;
                        isPush = false;
                        //移動を確定させる
                        if (moveState === 0) {
                            var arr = [];
                            for (var xx = 0; xx < mapX; xx++) {
                                arr.push(maps[y][xx].num);
                            }
                            var n = ev.startDelta.x + (panelSize / 2);
                            var num = (Math.floor(n / panelSize) + mapX);
                            for (var xx = 0; xx < mapX; xx++) {
                                var dx = ((num + xx) % mapX);
                                maps[y][dx].num = arr[xx];
                                var panel = panels[maps[y][dx].num];
                                panel.x = maps[y][dx].x;
                                panel.y = maps[y][dx].y;
                                panel.modified();
                            }
                            for (var xx = 0; xx < mapX; xx++) {
                                panels[maps[y][xx].num].show();
                            }
                            //移動用スプライトを非表示
                            for (var xx = 0; xx < mapX + 2; xx++) {
                                moveXPanels[xx].hide();
                            }
                            sprSelectX.hide();
                        }
                        if (moveState === 1) {
                            var arr = [];
                            for (var yy = 0; yy < mapY; yy++) {
                                arr.push(maps[yy][x].num);
                            }
                            var n = -ev.startDelta.y + (panelSize / 2);
                            var num = (Math.floor(n / panelSize) + mapY);
                            for (var yy = 0; yy < mapY; yy++) {
                                var dy = ((num + yy) % mapY);
                                maps[dy][x].num = arr[yy];
                                var panel = panels[maps[dy][x].num];
                                panel.x = maps[dy][x].x;
                                panel.y = maps[dy][x].y;
                                panel.modified();
                                panel.show();
                            }
                            //移動用スプライトを非表示
                            for (var yy = 0; yy < mapY + 2; yy++) {
                                moveXPanels[yy].hide();
                            }
                            sprSelectY.hide();
                        }
                        var moveFlg = true;
                        var moveCnt = 0;
                        var plusScore = 0;
                        var _loop_3 = function () {
                            moveFlg = false;
                            moveCnt++;
                            if (moveState === 0) {
                                //揃っている列を探す
                                var list = [];
                                if (mapY >= 2) {
                                    for (var xx = 0; xx < mapX; xx++) {
                                        var flg = true;
                                        for (var yy = 0; yy < mapY - 1; yy++) {
                                            if (panels[maps[yy][xx].num].num !== panels[maps[yy + 1][xx].num].num) {
                                                flg = false;
                                                break;
                                            }
                                        }
                                        if (flg)
                                            list.push(xx);
                                    }
                                }
                                if (list.length > 1) {
                                    var num_1 = list.length;
                                    timeline2.create()
                                        .wait((moveCnt - 1) * waitTime + (moveCnt - 2) * moveTime)
                                        .call(function () {
                                        labelCombo.text = "" + num_1;
                                        labelCombo.invalidate();
                                        labelCombo.show();
                                    }).every(function (a, b) {
                                        labelCombo.opacity = b;
                                        labelCombo.modified();
                                    }, waitTime).wait(2000).call(function () {
                                        labelCombo.hide();
                                    });
                                }
                                //消す
                                if (list.length > 0) {
                                    plusScore += (list.length * 100 + Math.pow(list.length - 1, 2) * 100); //スコア加算
                                    //効果音
                                    timeline.create()
                                        .wait((moveCnt - 1) * waitTime + (moveCnt - 2) * moveTime)
                                        .call(function () {
                                        playSound("clear");
                                    });
                                    var cnt = 0;
                                    list.push(-1); //番兵
                                    for (var xx = 0; xx < mapX; xx++) {
                                        if (list[cnt] === xx) {
                                            cnt++;
                                            var _loop_4 = function (yy) {
                                                var num = maps[yy][xx].num;
                                                var frameNum = panels[num].num + 4;
                                                timeline.create().wait((moveCnt - 1) * waitTime + (moveCnt - 1) * moveTime).call(function () {
                                                    panels[num].frameNumber = frameNum;
                                                    panels[num].modified();
                                                }).every(function (a, b) {
                                                    panels[num].opacity = (b * 2.0) / 1.0;
                                                    panels[num].modified();
                                                }, waitTime).call(function () {
                                                    panels[num].opacity = 1;
                                                    panels[num].hide();
                                                });
                                                panels[num].num = -1;
                                                maps[yy][xx].num = -1;
                                            };
                                            for (var yy = 0; yy < mapY; yy++) {
                                                _loop_4(yy);
                                            }
                                            moveFlg = true;
                                        }
                                        else {
                                            if (cnt > 0) {
                                                for (var yy = 0; yy < mapY; yy++) {
                                                    var num = maps[yy][xx].num;
                                                    var panel = panels[num];
                                                    maps[yy][xx - cnt].num = num;
                                                    var xxx = maps[yy][xx - cnt].x;
                                                    var yyy = maps[yy][xx - cnt].y;
                                                    timeline.create(panel, { modified: panel.modified, destroyed: panel.destroyed })
                                                        .wait(moveCnt * waitTime + (moveCnt) * moveTime).moveTo(xxx, yyy, moveTime);
                                                    maps[yy][xx].num = -1;
                                                }
                                            }
                                        }
                                    }
                                    mapX -= (list.length - 1);
                                }
                            }
                            if (moveState === 1) {
                                //揃っている列を探す
                                var list = [];
                                if (mapX >= 2) {
                                    for (var yy = 0; yy < mapY; yy++) {
                                        var flg = true;
                                        for (var xx = 0; xx < mapX - 1; xx++) {
                                            if (panels[maps[yy][xx].num].num !== panels[maps[yy][xx + 1].num].num) {
                                                flg = false;
                                                break;
                                            }
                                        }
                                        if (flg)
                                            list.push(yy);
                                    }
                                }
                                if (list.length > 1) {
                                    var num_2 = list.length;
                                    timeline2.create()
                                        .wait((moveCnt - 1) * waitTime + (moveCnt - 2) * moveTime)
                                        .call(function () {
                                        labelCombo.text = "" + num_2;
                                        labelCombo.invalidate();
                                        labelCombo.show();
                                    }).every(function (a, b) {
                                        labelCombo.opacity = b;
                                        labelCombo.modified();
                                    }, waitTime).wait(2000).call(function () {
                                        labelCombo.hide();
                                    });
                                }
                                //消す
                                if (list.length > 0) {
                                    plusScore += (list.length * 100 + Math.pow(list.length - 1, 2) * 100); //スコア加算
                                    //効果音
                                    timeline.create()
                                        .wait((moveCnt - 1) * waitTime + (moveCnt - 2) * moveTime)
                                        .call(function () {
                                        playSound("clear");
                                    });
                                    var cnt = 0;
                                    list.push(-1); //番兵
                                    for (var yy = 0; yy < mapY; yy++) {
                                        if (list[cnt] === yy) {
                                            cnt++;
                                            var _loop_5 = function (xx) {
                                                var num = maps[yy][xx].num;
                                                var frameNum = panels[num].num + 4;
                                                timeline.create().wait((moveCnt - 1) * waitTime + (moveCnt - 1) * moveTime).call(function () {
                                                    panels[num].frameNumber = frameNum;
                                                    panels[num].modified();
                                                }).every(function (a, b) {
                                                    panels[num].opacity = (b * 2.0) / 1.0;
                                                    panels[num].modified();
                                                }, waitTime).call(function () {
                                                    panels[num].opacity = 1;
                                                    panels[num].hide();
                                                });
                                                panels[num].num = -1;
                                                maps[yy][xx].num = -1;
                                            };
                                            for (var xx = 0; xx < mapX; xx++) {
                                                _loop_5(xx);
                                            }
                                            moveFlg = true;
                                        }
                                        else {
                                            if (cnt > 0) {
                                                for (var xx = 0; xx < mapX; xx++) {
                                                    var num = maps[yy][xx].num;
                                                    var panel = panels[num];
                                                    maps[yy - cnt][xx].num = num;
                                                    var xxx = maps[yy - cnt][xx].x;
                                                    var yyy = maps[yy - cnt][xx].y;
                                                    timeline.create(panel, { modified: panel.modified, destroyed: panel.destroyed })
                                                        .wait(moveCnt * waitTime + (moveCnt) * moveTime).moveTo(xxx, yyy, moveTime);
                                                    maps[yy][xx].num = -1;
                                                }
                                            }
                                        }
                                    }
                                    mapY -= (list.length - 1);
                                }
                            }
                            moveState = (moveState + 1) % 2;
                        };
                        while (moveFlg) {
                            _loop_3();
                        }
                        if (moveCnt > 1) {
                            //移動アニメーション中は操作不可能にする処理
                            isMoveing = true;
                            plusScore += (Math.pow(moveCnt - 2, 2) * 90); //連鎖ボーナス加算
                            timeline.create().wait((moveCnt - 1) * waitTime + (moveCnt - 2) * moveTime).call(function () {
                                addScore(plusScore);
                            });
                            timeline.create().wait(moveCnt * waitTime + (moveCnt - 1) * moveTime + 200).call(function () {
                                isMoveing = false;
                            });
                            //消した場所に新たに生成
                            var cntPos = 0;
                            var _loop_6 = function (yy) {
                                var _loop_7 = function (xx) {
                                    if (maps[yy][xx].num === -1) {
                                        while (panels[cntPos].num !== -1) {
                                            cntPos++;
                                        }
                                        maps[yy][xx].num = cntPos;
                                        var panel_1 = panels[cntPos];
                                        timeline.create().wait(moveCnt * waitTime + (moveCnt - 1) * moveTime).call(function () {
                                            panel_1.x = maps[yy][xx].x;
                                            panel_1.y = -100;
                                            panel_1.modified();
                                            panel_1.show();
                                            //最初から揃わないようににする処理
                                            var num = random.get(0, 3);
                                            if (xx > 0) {
                                                while (panels[maps[yy][xx - 1].num].num === num) {
                                                    num = random.get(0, 3);
                                                }
                                            }
                                            if (yy > 0) {
                                                while (panels[maps[yy - 1][xx].num].num === num) {
                                                    num = random.get(0, 3);
                                                }
                                            }
                                            panel_1.setNum(num);
                                        }).every(function (a, b) {
                                            panel_1.y = (maps[yy][xx].y + 100) * b - 100;
                                            panel_1.modified();
                                        }, 200);
                                        cntPos++;
                                    }
                                };
                                for (var xx = 0; xx < panelNumX; xx++) {
                                    _loop_7(xx);
                                }
                            };
                            for (var yy = 0; yy < panelNumY; yy++) {
                                _loop_6(yy);
                            }
                        }
                        else {
                            playSound("move");
                        }
                        var i = 1;
                        var renEvent = function () {
                            i++;
                            if (i === moveCnt) {
                                timeline2.create().wait(waitTime + moveTime + 1000).call(function () {
                                    labelRen.hide();
                                });
                                return;
                            }
                            labelRen.text = "" + i;
                            labelRen.invalidate();
                            timeline2.create().every(function (a, b) {
                                labelRen.opacity = b;
                                labelRen.modified();
                            }, 100).wait(waitTime + moveTime - 100).call(renEvent);
                        };
                        if (moveCnt > 2) {
                            timeline2.create().wait(waitTime).call(function () {
                                labelRen.show();
                                renEvent();
                            });
                        }
                        moveState = -1;
                        mapX = panelNumX;
                        mapY = panelNumY;
                        //printMap();
                    });
                };
                for (var x = 0; x < panelNumX; x++) {
                    _loop_2(x);
                }
            };
            for (var y = 0; y < panelNumY; y++) {
                _loop_1(y);
            }
            var printMap = function () {
                var str = "";
                for (var y = panelNumY - 1; y >= 0; y--) {
                    for (var x = 0; x < panelNumY; x++) {
                        str += "," + maps[y][x].num;
                    }
                    str += "\n";
                }
                console.log(str + "\n");
            };
            //パネル
            var panels = [];
            for (var i = 0; i < panelNumX * panelNumY; i++) {
                var spr = new Panel(_this, panelSize);
                base.append(spr);
                panels.push(spr);
            }
            //移動用パネル
            var moveXPanels = [];
            for (var i = 0; i < panelNumX + 2; i++) {
                var spr = new Panel(_this, panelSize);
                base.append(spr);
                moveXPanels.push(spr);
            }
            //選択範囲
            var sprSelectX = new g.FilledRect({
                scene: _this,
                width: panelSize * panelNumX,
                height: panelSize,
                cssColor: "white",
                opacity: 0.2
            });
            base.append(sprSelectX);
            var sprSelectY = new g.FilledRect({
                scene: _this,
                width: panelSize,
                height: panelSize * panelNumY,
                cssColor: "white",
                opacity: 0.2
            });
            base.append(sprSelectY);
            //メインループ
            var bkTime = 0;
            var timeLimit = 70;
            var startTime = 0;
            _this.update.add(function () {
                if (!isStart)
                    return;
                var t = timeLimit - Math.floor((Date.now() - startTime) / 1000);
                //終了処理
                if (t <= -1) {
                    finishBase.show();
                    isStart = false;
                    playSound("se_timeup");
                    timeline.create().wait(2200).call(function () {
                        if (typeof window !== "undefined" && window.RPGAtsumaru) {
                            window.RPGAtsumaru.experimental.scoreboards.setRecord(1, g.game.vars.gameState.score).then(function () {
                                btnRanking.show();
                                btnReset.show();
                            });
                        }
                        if (isDebug) {
                            btnRanking.show();
                            btnReset.show();
                        }
                    });
                    return;
                }
                labelTime.text = "" + t;
                labelTime.invalidate();
                if (bkTime !== t && t <= 5) {
                    fg.opacity = 0.1;
                    fg.modified();
                    timeline.create().wait(500).call(function () {
                        fg.opacity = 0.0;
                        fg.modified();
                    });
                }
                bkTime = t;
            });
            //リセット
            var reset = function () {
                bkTime = 0;
                startTime = Date.now();
                isStart = true;
                score = 0;
                labelScore.text = "0P";
                finishBase.hide();
                labelScore.invalidate();
                labelScorePlus.text = "";
                labelScorePlus.invalidate();
                mapX = panelNumX;
                mapY = panelNumY;
                sprStart.show();
                timeline.create().wait(750).call(function () {
                    sprStart.hide();
                });
                labelCombo.hide();
                labelRen.hide();
                btnRanking.hide();
                btnReset.hide();
                fg.opacity = 0;
                fg.modified();
                //パネルの設定
                var colors = ["red", "green", "yellow", "blue"];
                var cnt = 0;
                for (var y = 0; y < panelNumY; y++) {
                    for (var x = 0; x < panelNumY; x++) {
                        maps[y][x].num = cnt;
                        panels[cnt].x = maps[y][x].x;
                        panels[cnt].y = maps[y][x].y;
                        var num = random.get(0, 3);
                        if (x > 0) {
                            while (panels[maps[y][x - 1].num].num === num) {
                                num = random.get(0, 3);
                            }
                        }
                        if (y > 0) {
                            while (panels[maps[y - 1][x].num].num === num) {
                                num = random.get(0, 3);
                            }
                        }
                        panels[cnt].setNum(num);
                        panels[cnt].show();
                        cnt++;
                    }
                }
                for (var i = 0; i < panelNumX + 2; i++) {
                    moveXPanels[i].hide();
                }
                sprSelectX.hide();
                sprSelectY.hide();
                playSound("se_start");
                startTime = Date.now();
            };
        });
        return _this;
    }
    return MainScene;
}(g.Scene));
exports.MainScene = MainScene;
var Map = /** @class */ (function (_super) {
    __extends(Map, _super);
    function Map(param) {
        var _this = _super.call(this, param) || this;
        _this.num = 0;
        return _this;
    }
    return Map;
}(g.FilledRect));
var Panel = /** @class */ (function (_super) {
    __extends(Panel, _super);
    function Panel(scene, panelSize) {
        var _this = _super.call(this, {
            scene: scene,
            width: panelSize,
            height: panelSize,
            src: scene.assets["panel"],
            frames: [0, 1, 2, 3, 4, 5, 6, 7]
        }) || this;
        _this.num = 0;
        _this.colors = ["red", "green", "yellow", "blue"];
        return _this;
    }
    Panel.prototype.setNum = function (num) {
        this.num = num;
        this.frameNumber = num;
        this.modified();
    };
    return Panel;
}(g.FrameSprite));
