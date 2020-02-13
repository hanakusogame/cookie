import { Config } from "./Config";
import { Button } from "./Button";
declare function require(x: string): any;
export class MainScene extends g.Scene {
	public lastJoinedPlayerId: string; // 配信者のID
	private font: g.Font;

	constructor(param: g.SceneParameterObject) {
		param.assetIds = [
			"img_numbers_n", "img_numbers_n_red", "title", "start", "finish", "combo", "waku", "score", "time",
			"config","volume","test", "glyph72", "number_p", "number_b",
			"panel",
			"se_start", "se_timeup", "move", "bgm", "clear"];
		super(param);

		const tl = require("@akashic-extension/akashic-timeline");
		const timeline = new tl.Timeline(this);
		const timeline2 = new tl.Timeline(this);

		this.loaded.add(() => {

			g.game.vars.gameState = { score: 0 };

			const size = 280;
			const panelNumX = 4;
			const panelNumY = 4;
			const panelSize = size / panelNumY;
			const margin = 40;
			const isDebug = false;//デバッグ用必ずfalseに

			// 何も送られてこない時は、標準の乱数生成器を使う
			let random = g.game.random;
			let isStart = false;

			this.message.add((msg) => {
				if (msg.data && msg.data.type === "start" && msg.data.parameters) { // セッションパラメータのイベント
					const sessionParameters = msg.data.parameters;
					if (sessionParameters.randomSeed != null) {
						// プレイヤー間で共通の乱数生成器を生成
						// `g.XorshiftRandomGenerator` は Akashic Engine の提供する乱数生成器実装で、 `g.game.random` と同じ型。
						random = new g.XorshiftRandomGenerator(sessionParameters.randomSeed);
					}
				}
			});

			// 配信者のIDを取得
			this.lastJoinedPlayerId = "";
			g.game.join.add((ev) => {
				this.lastJoinedPlayerId = ev.player.id;
			});

			// 背景
			const bg = new g.FilledRect({ scene: this, width: 640, height: 360, cssColor: "green", opacity: 0 });
			this.append(bg);
			if ((typeof window !== "undefined" && window.RPGAtsumaru) || isDebug) {
				bg.opacity = 1.0;
				bg.modified();
			}

			const base = new g.Pane({ scene: this, x: margin + 50, y: margin, width: size, height: size });
			this.append(base);
			base.hide();

			const waku = new g.Sprite({ scene: this, src: this.assets["waku"], x: 49, y: -1 });
			this.append(waku);
			waku.hide();

			const uiBase = new g.E({ scene: this });
			this.append(uiBase);
			uiBase.hide();

			//タイトル
			const sprTitle = new g.Sprite({ scene: this, src: this.assets["title"], x: 70 });
			this.append(sprTitle);
			timeline.create(
				sprTitle, {
					modified: sprTitle.modified, destroyd: sprTitle.destroyed
				}).wait(5000).moveBy(-800, 0, 200).call(() => {
					bg.show();
					waku.show();
					base.show();
					uiBase.show();
					isStart = true;
					reset();
				});

			//フォント生成
			let glyph = JSON.parse((this.assets["test"] as g.TextAsset).data);
			const numFont = new g.BitmapFont({
				src: this.assets["img_numbers_n"],
				map: glyph.map,
				defaultGlyphWidth: glyph.width,
				defaultGlyphHeight: glyph.height,
				missingGlyph: glyph.missingGlyph
			});

			const numFontRed = new g.BitmapFont({
				src: this.assets["img_numbers_n_red"],
				map: glyph.map,
				defaultGlyphWidth: glyph.width,
				defaultGlyphHeight: glyph.height,
				missingGlyph: glyph.missingGlyph
			});

			glyph = JSON.parse((this.assets["glyph72"] as g.TextAsset).data);
			const numFontP = new g.BitmapFont({
				src: this.assets["number_p"],
				map: glyph.map,
				defaultGlyphWidth: 72,
				defaultGlyphHeight: 80
			});

			glyph = JSON.parse((this.assets["glyph72"] as g.TextAsset).data);
			const numFontB = new g.BitmapFont({
				src: this.assets["number_b"],
				map: glyph.map,
				defaultGlyphWidth: 72,
				defaultGlyphHeight: 80
			});

			//スコア
			uiBase.append(new g.Sprite({ scene: this, src: this.assets["score"], x: 450, y: 6 }));
			let score = 0;
			const labelScore = new g.Label({
				scene: this,
				x: 440,
				y: 45,
				width: 32 * 6,
				fontSize: 32,
				font: numFont,
				text: "0P",
				textAlign: g.TextAlign.Right, widthAutoAdjust: false
			});
			uiBase.append(labelScore);

			const labelScorePlus = new g.Label({
				scene: this,
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
			const labelCombo = new g.Label({ scene: this, font: numFontB, fontSize: 72, text: "4", x: 420, y: 120 });
			uiBase.append(labelCombo);
			const sprCombo = new g.Sprite({ scene: this, src: this.assets["combo"], x: 70, y: 20, width: 135, height: 50 })
			labelCombo.append(sprCombo);

			//連鎖表示
			const labelRen = new g.Label({ scene: this, font: numFontP, fontSize: 72, text: "4", x: 420, y: 200 });
			uiBase.append(labelRen);
			const sprRen = new g.Sprite({ scene: this, src: this.assets["combo"], x: 90, y: 20, width: 135, height: 50, srcY: 50 });
			labelRen.append(sprRen);

			//タイム
			uiBase.append(new g.Sprite({ scene: this, src: this.assets["time"], x: 540, y: 320 }));
			const labelTime = new g.Label({ scene: this, font: numFont, fontSize: 32, text: "70", x: 580, y: 323 });
			uiBase.append(labelTime);

			//開始
			const sprStart = new g.Sprite({ scene: this, src: this.assets["start"], x: 50, y: 100 });
			uiBase.append(sprStart);
			sprStart.hide();

			//終了
			const finishBase = new g.E({ scene: this, x: 0, y: 0 });
			this.append(finishBase);
			finishBase.hide();

			const finishBg = new g.FilledRect({ scene: this, width: 640, height: 360, cssColor: "#000000", opacity: 0.3 });
			finishBase.append(finishBg);

			const sprFinish = new g.Sprite({ scene: this, src: this.assets["finish"], x: 120, y: 100 });
			finishBase.append(sprFinish);

			//最前面
			const fg = new g.FilledRect({ scene: this, width: 640, height: 480, cssColor: "#ff0000", opacity: 0.0 });
			this.append(fg);

			//リセットボタン
			const btnReset = new Button(this, ["リセット"], 500, 270, 130);
			if ((typeof window !== "undefined" && window.RPGAtsumaru) || isDebug) {
				finishBase.append(btnReset);
				btnReset.pushEvent = () => {
					reset();
				};
			}

			//ランキングボタン
			const btnRanking = new Button(this, ["ランキング"], 500, 200, 130);
			if ((typeof window !== "undefined" && window.RPGAtsumaru) || isDebug) {
				finishBase.append(btnRanking);
				btnRanking.pushEvent = () => {
					window.RPGAtsumaru.experimental.scoreboards.display(1);
				};
			}

			//設定ボタン
			const btnConfig = new g.Sprite({ scene: this, x: 600, y: 0, src: this.assets["config"], touchable: true });
			if ((typeof window !== "undefined" && window.RPGAtsumaru) || isDebug) {
				this.append(btnConfig);
			}

			//設定画面
			const config = new Config(this, 380, 40);
			if ((typeof window !== "undefined" && window.RPGAtsumaru) || isDebug) {
				this.append(config);
			}
			config.hide();

			btnConfig.pointDown.add(() => {
				if (config.state & 1) {
					config.show();
				} else {
					config.hide();
				}
			});

			config.bgmEvent = (num) => {
				bgm.changeVolume(0.5 * num);
			};

			config.colorEvent = (str) => {
				bg.cssColor = str;
				bg.modified();
			};

			const playSound = (name: string) => {
				(this.assets[name] as g.AudioAsset).play().changeVolume(config.volumes[1]);
			};

			const bgm = (this.assets["bgm"] as g.AudioAsset).play();
			bgm.changeVolume(0.2);

			//スコア加算表示
			let bkTweenScore: any;
			const addScore = (num: number) => {

				if (score + num < 0) {
					num = -score;
				}

				score += num;

				timeline.create().every((e: number, p: number) => {
					labelScore.text = "" + (score - Math.floor(num * (1 - p))) + "P";
					labelScore.invalidate();
				}, 400);

				labelScorePlus.text = "+" + num;
				labelScorePlus.invalidate();
				if (bkTweenScore) timeline2.remove(bkTweenScore);
				bkTweenScore = timeline2.create().every((e: number, p: number) => {
					labelScorePlus.opacity = p;
					labelScorePlus.modified();
				}, 100).wait(4000).call(() => {
					labelScorePlus.opacity = 0;
					labelScorePlus.modified();
				});

				g.game.vars.gameState.score = score;
			};

			//パネルの土台
			const maps: Map[][] = [];
			let mapX = 0;
			let mapY = 0;
			let moveState = -1;
			const waitTime = 400;
			const moveTime = 100;
			let isMoveing = false;
			let isPush = false;

			for (let y = 0; y < panelNumY; y++) {
				maps.push([]);
				for (let x = 0; x < panelNumX; x++) {
					const spr = new Map({
						scene: this,
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
					spr.pointDown.add((ev) => {
						if (!isStart) return;
						if (isMoveing) return;

						sprSelectX.y = spr.y;
						sprSelectX.modified();
						sprSelectX.show();

						sprSelectY.x = spr.x;
						sprSelectY.modified();
						sprSelectY.show();
						isPush = true;

						//画面外にドラッグして離されたとき
						if (moveState !== -1) {
							moveXPanels.forEach((e) => e.hide());
							panels.forEach((e) => e.show());
							moveState = -1;
						}
					});

					//移動
					spr.pointMove.add((ev) => {
						if (!isPush || !isStart) return;

						const mx = ev.startDelta.x;
						const my = ev.startDelta.y;

						//移動方向を決める
						if (moveState === -1) {
							const limit = 20;
							if (mx < -limit || mx > limit) {
								moveState = 0;
								sprSelectY.hide();

								for (let xx = 0; xx < mapX; xx++) {
									panels[maps[y][xx].num].hide();
								}

								//移動用
								for (let xx = 0; xx < mapX + 2; xx++) {
									moveXPanels[xx].y = spr.y;
									moveXPanels[xx].x = (xx - 1) * panelSize;
									const num = maps[y][(xx - 1 + mapX) % mapX].num;
									moveXPanels[xx].setNum(panels[num].num);
									moveXPanels[xx].show();
								}

							} else if (my < -limit || my > limit) {
								moveState = 1;
								sprSelectX.hide();

								for (let yy = 0; yy < mapY; yy++) {
									panels[maps[yy][x].num].hide();
								}

								//移動用
								for (let yy = 0; yy < mapY + 2; yy++) {
									moveXPanels[yy].y = (mapY - yy) * panelSize;
									moveXPanels[yy].x = spr.x;
									const num = maps[(yy - 1 + mapY) % mapY][x].num;
									moveXPanels[yy].setNum(panels[num].num);
									moveXPanels[yy].show();
								}
							}
						}

						if (moveState === 0) {
							//移動用
							for (let xx = 0; xx < mapX + 2; xx++) {
								moveXPanels[xx].x = (xx - 1) * panelSize + (mx % panelSize);
								const j = mx >= 0 ? Math.floor(mx / panelSize) : Math.ceil(mx / panelSize);
								const i = mapX - (j % mapX);
								const num = maps[y][(xx - 1 + mapX + i) % mapX].num;
								moveXPanels[xx].setNum(panels[num].num);
								moveXPanels[xx].show();
							}
						}

						if (moveState === 1) {
							//移動用
							for (let yy = 0; yy < mapY + 2; yy++) {
								moveXPanels[yy].y = (mapY - yy) * panelSize + (my % panelSize);
								const j = -my >= 0 ? Math.floor(-my / panelSize) : Math.ceil(-my / panelSize);
								const i = mapY - (j % mapY);
								const num = maps[(yy - 1 + mapY + i) % mapY][x].num;
								moveXPanels[yy].setNum(panels[num].num);
								moveXPanels[yy].show();
							}
						}

					});

					//離したとき
					spr.pointUp.add((ev) => {

						if (!isPush || !isStart) return;

						isPush = false;

						//移動を確定させる
						if (moveState === 0) {
							const arr: number[] = [];
							for (let xx = 0; xx < mapX; xx++) {
								arr.push(maps[y][xx].num);
							}

							const n = ev.startDelta.x + (panelSize / 2);
							const num = (Math.floor(n / panelSize) + mapX);
							for (let xx = 0; xx < mapX; xx++) {
								const dx = ((num + xx) % mapX);
								maps[y][dx].num = arr[xx];

								const panel = panels[maps[y][dx].num];
								panel.x = maps[y][dx].x;
								panel.y = maps[y][dx].y;
								panel.modified();
							}

							for (let xx = 0; xx < mapX; xx++) {
								panels[maps[y][xx].num].show();
							}

							//移動用スプライトを非表示
							for (let xx = 0; xx < mapX + 2; xx++) {
								moveXPanels[xx].hide();
							}

							sprSelectX.hide();
						}

						if (moveState === 1) {

							const arr: number[] = [];
							for (let yy = 0; yy < mapY; yy++) {
								arr.push(maps[yy][x].num);
							}

							const n = -ev.startDelta.y + (panelSize / 2);
							const num = (Math.floor(n / panelSize) + mapY);
							for (let yy = 0; yy < mapY; yy++) {
								const dy = ((num + yy) % mapY);
								maps[dy][x].num = arr[yy];

								const panel = panels[maps[dy][x].num];
								panel.x = maps[dy][x].x;
								panel.y = maps[dy][x].y;
								panel.modified();
								panel.show();
							}

							//移動用スプライトを非表示
							for (let yy = 0; yy < mapY + 2; yy++) {
								moveXPanels[yy].hide();
							}

							sprSelectY.hide();
						}

						let moveFlg = true;
						let moveCnt = 0;
						let plusScore = 0;
						while (moveFlg) {
							moveFlg = false;
							moveCnt++;
							if (moveState === 0) {
								//揃っている列を探す
								const list: number[] = [];
								if (mapY >= 2) {
									for (let xx = 0; xx < mapX; xx++) {
										let flg = true;
										for (let yy = 0; yy < mapY - 1; yy++) {
											if (panels[maps[yy][xx].num].num !== panels[maps[yy + 1][xx].num].num) {
												flg = false;
												break;
											}
										}
										if (flg) list.push(xx);
									}
								}

								if (list.length > 1) {
									const num = list.length;
									timeline2.create()
										.wait((moveCnt - 1) * waitTime + (moveCnt - 2) * moveTime)
										.call(() => {
											labelCombo.text = "" + num;
											labelCombo.invalidate();
											labelCombo.show();
										}).every((a: number, b: number) => {
											labelCombo.opacity = b;
											labelCombo.modified();
										}, waitTime).wait(2000).call(() => {
											labelCombo.hide();
										});
								}

								//消す
								if (list.length > 0) {
									plusScore += (list.length * 100 + Math.pow(list.length - 1, 2) * 100);//スコア加算

									//効果音
									timeline.create()
										.wait((moveCnt - 1) * waitTime + (moveCnt - 2) * moveTime)
										.call(() => {
											playSound("clear");
										});

									let cnt = 0;
									list.push(-1);//番兵
									for (let xx = 0; xx < mapX; xx++) {
										if (list[cnt] === xx) {
											cnt++;
											for (let yy = 0; yy < mapY; yy++) {
												const num = maps[yy][xx].num;
												const frameNum = panels[num].num + 4;
												timeline.create().wait((moveCnt - 1) * waitTime + (moveCnt - 1) * moveTime).call(() => {
													panels[num].frameNumber = frameNum;
													panels[num].modified();
												}).every((a: number, b: number) => {
													panels[num].opacity = (b * 2.0) / 1.0;
													panels[num].modified();
												}, waitTime).call(() => {
													panels[num].opacity = 1;
													panels[num].hide();
												});
												panels[num].num = -1;
												maps[yy][xx].num = -1;
											}
											moveFlg = true;
										} else {
											if (cnt > 0) {
												for (let yy = 0; yy < mapY; yy++) {
													const num = maps[yy][xx].num;
													const panel = panels[num];
													maps[yy][xx - cnt].num = num;
													const xxx = maps[yy][xx - cnt].x;
													const yyy = maps[yy][xx - cnt].y;
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
								const list: number[] = [];
								if (mapX >= 2) {
									for (let yy = 0; yy < mapY; yy++) {
										let flg = true;
										for (let xx = 0; xx < mapX - 1; xx++) {
											if (panels[maps[yy][xx].num].num !== panels[maps[yy][xx + 1].num].num) {
												flg = false;
												break;
											}
										}
										if (flg) list.push(yy);
									}
								}

								if (list.length > 1) {
									const num = list.length;
									timeline2.create()
										.wait((moveCnt - 1) * waitTime + (moveCnt - 2) * moveTime)
										.call(() => {
											labelCombo.text = "" + num;
											labelCombo.invalidate();
											labelCombo.show();
										}).every((a: number, b: number) => {
											labelCombo.opacity = b;
											labelCombo.modified();
										}, waitTime).wait(2000).call(() => {
											labelCombo.hide();
										});
								}

								//消す
								if (list.length > 0) {
									plusScore += (list.length * 100 + Math.pow(list.length - 1, 2) * 100);//スコア加算

									//効果音
									timeline.create()
										.wait((moveCnt - 1) * waitTime + (moveCnt - 2) * moveTime)
										.call(() => {
											playSound("clear");
										});

									let cnt = 0;
									list.push(-1);//番兵
									for (let yy = 0; yy < mapY; yy++) {
										if (list[cnt] === yy) {
											cnt++;
											for (let xx = 0; xx < mapX; xx++) {
												const num = maps[yy][xx].num;
												const frameNum = panels[num].num + 4;
												timeline.create().wait((moveCnt - 1) * waitTime + (moveCnt - 1) * moveTime).call(() => {
													panels[num].frameNumber = frameNum;
													panels[num].modified();
												}).every((a: number, b: number) => {
													panels[num].opacity = (b * 2.0) / 1.0;
													panels[num].modified();
												}, waitTime).call(() => {
													panels[num].opacity = 1;
													panels[num].hide();
												});
												panels[num].num = -1;
												maps[yy][xx].num = -1;
											}
											moveFlg = true;
										} else {
											if (cnt > 0) {
												for (let xx = 0; xx < mapX; xx++) {
													const num = maps[yy][xx].num;
													const panel = panels[num];
													maps[yy - cnt][xx].num = num;
													const xxx = maps[yy - cnt][xx].x;
													const yyy = maps[yy - cnt][xx].y;
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
						}

						if (moveCnt > 1) {
							//移動アニメーション中は操作不可能にする処理
							isMoveing = true;

							plusScore += (Math.pow(moveCnt - 2, 2) * 90);//連鎖ボーナス加算
							timeline.create().wait((moveCnt - 1) * waitTime + (moveCnt - 2) * moveTime).call(() => {
								addScore(plusScore);
							});

							timeline.create().wait(moveCnt * waitTime + (moveCnt - 1) * moveTime + 200).call(() => {
								isMoveing = false;
							});

							//消した場所に新たに生成
							let cntPos = 0;
							for (let yy = 0; yy < panelNumY; yy++) {
								for (let xx = 0; xx < panelNumX; xx++) {
									if (maps[yy][xx].num === -1) {
										while (panels[cntPos].num !== -1) {
											cntPos++;
										}
										maps[yy][xx].num = cntPos;
										const panel = panels[cntPos];
										timeline.create().wait(moveCnt * waitTime + (moveCnt - 1) * moveTime).call(() => {
											panel.x = maps[yy][xx].x;
											panel.y = -100;
											panel.modified();
											panel.show();

											//最初から揃わないようににする処理
											let num = random.get(0, 3);
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
											panel.setNum(num);
										}).every((a: number, b: number) => {
											panel.y = (maps[yy][xx].y + 100) * b - 100;
											panel.modified();
										}, 200);
										cntPos++;
									}
								}
							}
						} else {
							playSound("move");
						}

						let i = 1;
						const renEvent = () => {
							i++;
							if (i === moveCnt) {
								timeline2.create().wait(waitTime + moveTime + 1000).call(() => {
									labelRen.hide();
								});
								return;
							}
							labelRen.text = "" + i;
							labelRen.invalidate();
							timeline2.create().every((a: number, b: number) => {
								labelRen.opacity = b;
								labelRen.modified();
							}, 100).wait(waitTime + moveTime - 100).call(renEvent);
						};

						if (moveCnt > 2) {
							timeline2.create().wait(waitTime).call(() => {
								labelRen.show();
								renEvent();
							});
						}

						moveState = -1;

						mapX = panelNumX;
						mapY = panelNumY;

						//printMap();
					});

				}
			}

			const printMap = () => {
				let str = "";
				for (let y = panelNumY - 1; y >= 0; y--) {
					for (let x = 0; x < panelNumY; x++) {
						str += "," + maps[y][x].num;
					}
					str += "\n";
				}
				console.log(str + "\n");
			};

			//パネル
			const panels: Panel[] = [];
			for (let i = 0; i < panelNumX * panelNumY; i++) {
				const spr = new Panel(this, panelSize);
				base.append(spr);
				panels.push(spr);
			}

			//移動用パネル
			const moveXPanels: Panel[] = [];
			for (let i = 0; i < panelNumX + 2; i++) {
				const spr = new Panel(this, panelSize);
				base.append(spr);
				moveXPanels.push(spr);
			}

			//選択範囲
			const sprSelectX = new g.FilledRect({
				scene: this,
				width: panelSize * panelNumX,
				height: panelSize,
				cssColor: "white",
				opacity: 0.2
			});
			base.append(sprSelectX);

			const sprSelectY = new g.FilledRect({
				scene: this,
				width: panelSize,
				height: panelSize * panelNumY,
				cssColor: "white",
				opacity: 0.2
			});
			base.append(sprSelectY);

			//メインループ
			let bkTime = 0;
			const timeLimit = 70;
			let startTime: number = 0;
			this.update.add(() => {
				if (!isStart) return;
				const t = timeLimit - Math.floor((Date.now() - startTime) / 1000);

				//終了処理
				if (t <= -1) {

					finishBase.show();

					isStart = false;

					playSound("se_timeup");

					timeline.create().wait(2200).call(() => {
						if (typeof window !== "undefined" && window.RPGAtsumaru) {
							window.RPGAtsumaru.experimental.scoreboards.setRecord(1, g.game.vars.gameState.score).then(() => {
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
					timeline.create().wait(500).call(() => {
						fg.opacity = 0.0;
						fg.modified();
					});
				}

				bkTime = t;
			});

			//リセット
			const reset = () => {
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
				timeline.create().wait(750).call(() => {
					sprStart.hide();
				});

				labelCombo.hide();
				labelRen.hide();

				btnRanking.hide();
				btnReset.hide();
				fg.opacity = 0;
				fg.modified();

				//パネルの設定
				const colors = ["red", "green", "yellow", "blue"];
				let cnt = 0;
				for (let y = 0; y < panelNumY; y++) {
					for (let x = 0; x < panelNumY; x++) {
						maps[y][x].num = cnt;
						panels[cnt].x = maps[y][x].x;
						panels[cnt].y = maps[y][x].y;
						let num = random.get(0, 3);
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

				for (let i = 0; i < panelNumX + 2; i++) {
					moveXPanels[i].hide();
				}

				sprSelectX.hide();
				sprSelectY.hide();

				playSound("se_start");

				startTime = Date.now();
			};

		});
	}
}

class Map extends g.FilledRect {
	public num: number = 0;
	constructor(param: g.FilledRectParameterObject) {
		super(param);
	}
}

class Panel extends g.FrameSprite {
	public num: number = 0;
	private colors: string[] = ["red", "green", "yellow", "blue"];
	constructor(scene: g.Scene, panelSize: number) {
		super({
			scene: scene,
			width: panelSize,
			height: panelSize,
			src: scene.assets["panel"] as g.ImageAsset,
			frames: [0, 1, 2, 3, 4, 5, 6, 7]
		});
	}

	public setNum(num: number) {
		this.num = num;
		this.frameNumber = num;
		this.modified();
	}
}
