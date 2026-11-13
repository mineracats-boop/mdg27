/* MDG27 · MOTOR NUEVO · fase 2: partido 11 contra 11 */
(async () => {
  const STREET = /modo=street/.test(location.search), PLAYA = STREET && /cancha=playa/.test(location.search); window.STREET = STREET; window.PLAYA = PLAYA;   // Street Football: jaula de 40 x 22 con paredes, 4 contra 4
  const L = STREET ? 40 : 105, W = STREET ? 22 : 68, GW = STREET ? 3.6 : 7.32, GH = STREET ? 2.1 : 2.44, GD = STREET ? 1.2 : 2.0, BR = .11, G = 9.81;
  const P3 = (x, y, z = 0) => new THREE.Vector3(x - L / 2, z, y - W / 2);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t;
  const angD = (a, b) => Math.atan2(Math.sin(b - a), Math.cos(b - a));
  const $ = s => document.querySelector(s);
  const META = window.MA ? JSON.parse(window.MA.meta) : await fetch("mx_meta.json").then(r => r.json());
  const b64buf = s => { const b = atob(s), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u.buffer; };
  // modelos incrustados (versión sin internet): se sueltan de memoria al usarlos; los descargados se guardan para reutilizar
  const AC_ = {}, asset = n => { if (window.MA && window.MA[n]) { const v = window.MA[n]; if (n !== "meta") delete window.MA[n]; return Promise.resolve(v); } return AC_[n] || (AC_[n] = fetch("m3d/" + n + ".txt").then(r => r.text())); };
  if (!window.MA) (window.PREF || []).forEach(n => asset(n).catch(() => {}));
  // calidad gráfica: alta / media / baja (se guarda en el navegador); por defecto media en tabletas, móviles y equipos con poca memoria
  const QUAL = (() => { let q = (location.search.match(/[?&]q=(alta|media|baja)/) || [])[1] || null; try { q = q || localStorage.getItem("mdg27q"); } catch (e) {} if (q) return q; const touch = matchMedia("(pointer: coarse)").matches, mem = navigator.deviceMemory || 8; return touch || mem <= 4 ? "baja" : "media"; })();
  let REAL = (() => { try { const v = localStorage.getItem("mdg27real"); return v == null ? QUAL === "alta" : v === "1"; } catch (e) { return false; } })();
  window.QUAL = QUAL; const TEXMAX = QUAL === "alta" ? 2048 : QUAL === "media" ? 1024 : 768;   // descargas en paralelo desde el principio
  const T0_ = performance.now(); window.__LT0 = Math.round(T0_); let TL_ = T0_; window.__LT = []; const setLoad = t => { const n = performance.now(); window.__LT.push([t, Math.round(n - TL_)]); TL_ = n; const e = $("#load b"); if (e) e.textContent = t; };

  /* ---------- render ---------- */
  const cv = $("#cv"), Rn = new THREE.WebGLRenderer({ canvas: cv, antialias: true, powerPreference: "high-performance" });
  window.__RN = Rn; window.__CAM = () => [cam, sun]; Rn.domElement.addEventListener("webglcontextlost", e => { e.preventDefault(); try { localStorage.setItem("mdg27q", "baja"); } catch (er) {} const d = document.createElement("div"); Object.assign(d.style, { position: "fixed", inset: "0", display: "grid", placeItems: "center", background: "#050a14", color: "#fff", zIndex: 99, textAlign: "center", padding: "16px", font: "600 18px system-ui" }); d.innerHTML = "La tarjeta gráfica se ha quedado sin memoria.<br>He puesto la calidad en Baja.<br><br><button style='font:inherit;padding:10px 22px;border:0;border-radius:8px;background:#ffd23a;color:#111;cursor:pointer'>Volver a cargar</button>"; d.querySelector("button").onclick = () => location.reload(); document.body.appendChild(d); }); Rn.debug.checkShaderErrors = !!window.SHDBG; if (QUAL !== "alta") Rn.shadowMap.type = THREE.PCFShadowMap; Rn.outputColorSpace = THREE.SRGBColorSpace; Rn.toneMapping = THREE.ACESFilmicToneMapping; Rn.toneMappingExposure = 1.05;
  Rn.shadowMap.enabled = true; Rn.shadowMap.type = THREE.PCFSoftShadowMap;
  // texturas comprimidas para la tarjeta gráfica (KTX2/Basis): ocupan unas 8 veces menos memoria; el descompresor va incluido (sin internet también)
  if (window.KTX2Loader && !/ktx=0/.test(location.search)) { try { const [bj, bw] = await Promise.all([asset("basis_js"), asset("basis_wasm")]);
      const u1 = URL.createObjectURL(new Blob([atob(bj)], { type: "text/javascript" })), u2 = URL.createObjectURL(new Blob([b64buf(bw)], { type: "application/wasm" }));
      const prevMod = THREE.DefaultLoadingManager.urlModifier; THREE.DefaultLoadingManager.setURLModifier(u => /basis_transcoder\.js$/.test(u) ? u1 : /basis_transcoder\.wasm$/.test(u) ? u2 : prevMod ? prevMod(u) : u);
      const K2 = new KTX2Loader().setTranscoderPath("basis/").detectSupport(Rn); window.__KTX2 = K2;
      const op = GLTFLoader.prototype.parse; GLTFLoader.prototype.parse = function (...a) { if (!this.ktx2Loader) this.setKTX2Loader(K2); return op.apply(this, a); };
    } catch (e) { console.warn("KTX2", e); } }
  const S = new THREE.Scene(); window.__S = S; S.fog = new THREE.Fog(0xa9c4dc, 180, 420);
  { const sky = new THREE.Mesh(new THREE.SphereGeometry(500, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, uniforms: {},
      vertexShader: "varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }",
      fragmentShader: "varying vec3 vP; float h2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); } float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h2(i), h2(i + vec2(1., 0.)), f.x), mix(h2(i + vec2(0., 1.)), h2(i + vec2(1., 1.)), f.x), f.y); } float fbm(vec2 p){ float a = .5, r = 0.; for (int k = 0; k < 5; k++) { r += a * vn(p); p *= 2.03; a *= .5; } return r; } void main(){ vec3 d = normalize(vP); float h = d.y; vec3 c = mix(vec3(.78,.86,.95), vec3(.18,.42,.82), smoothstep(0., .6, h)); vec2 uv = d.xz / max(.12, h + .15) * 1.6; float n = smoothstep(.5, .8, fbm(uv)) * smoothstep(.02, .25, h); c = mix(c, vec3(.97,.98,1.), n * .8); gl_FragColor = vec4(c, 1.); }" })); S.add(sky); window.__sky = sky; }
  const cam = new THREE.PerspectiveCamera(30, 16 / 9, .1, 600);
  // luz ambiental de imagen (cielo + césped): da brillo y volumen a camisetas y piel como en la tele
  { const es = new THREE.Scene(), sk = new THREE.Mesh(new THREE.SphereGeometry(50, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide, uniforms: {},
      vertexShader: "varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }",
      fragmentShader: "varying vec3 vP; void main(){ float h = normalize(vP).y; vec3 up = mix(vec3(.85,.9,1.), vec3(.45,.65,1.), smoothstep(0., .7, h)); vec3 dn = vec3(.16,.32,.12); vec3 c = h > 0. ? up : mix(vec3(.5,.55,.5), dn, smoothstep(0., -.3, h)); c += vec3(3.) * smoothstep(.985, 1., dot(normalize(vP), normalize(vec3(-.4,.75,-.5)))); gl_FragColor = vec4(c, 1.); }" }));
    es.add(sk); const pm = new THREE.PMREMGenerator(Rn); S.environment = pm.fromScene(es, .03).texture; S.environmentIntensity = .55; pm.dispose(); }
  S.add(new THREE.HemisphereLight(0xe8eeff, 0x3a5a2a, 1.0));
  const sun = new THREE.DirectionalLight(0xfff4e0, 2.4); sun.castShadow = QUAL !== "baja"; sun.shadow.mapSize.set(QUAL === "alta" ? 2048 : 1024, QUAL === "alta" ? 2048 : 1024);
  Object.assign(sun.shadow.camera, { left: -22, right: 22, top: 22, bottom: -22, near: 1, far: 170 }); sun.shadow.bias = -.0004; sun.shadow.normalBias = .02; S.add(sun, sun.target);
  const loadTex = async (n, srgb = true) => { const src = await asset(n); return new Promise(res => { const im = new Image(); im.onload = () => { const t = new THREE.Texture(im); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = Math.min(8, Rn.capabilities.getMaxAnisotropy()); t.needsUpdate = true; res(t); }; im.src = src; }); };

  /* ---------- estadio (mismo que el juego) ---------- */
  function cyl(a, b, r, mat) { const d = new THREE.Vector3().subVectors(b, a), m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, d.length(), 14), mat); m.position.copy(a).addScaledVector(d, .5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize()); m.castShadow = true; S.add(m); return m; }
  const nets = [];
  function goal(side, netMat, white) {
    const gx = side ? L : 0, dir = side ? 1 : -1, y0 = W / 2 - GW / 2, y1 = W / 2 + GW / 2, r = .06, bx = gx + dir * GD, p = P3;
    cyl(p(gx, y0, 0), p(gx, y0, GH + r), r, white); cyl(p(gx, y1, 0), p(gx, y1, GH + r), r, white); cyl(p(gx, y0 - r, GH), p(gx, y1 + r, GH), r, white);
    const r2 = .035; cyl(p(bx, y0, 0), p(bx, y0, GH), r2, white); cyl(p(bx, y1, 0), p(bx, y1, GH), r2, white); cyl(p(bx, y0, GH), p(bx, y1, GH), r2, white);
    cyl(p(gx, y0, GH), p(bx, y0, GH), r2, white); cyl(p(gx, y1, GH), p(bx, y1, GH), r2, white);
    const sq = (g, w, h) => { const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w / 1.3, uv.getY(i) * h / 1.3); return g; };
    const back = new THREE.Mesh(sq(new THREE.PlaneGeometry(GW, GH, 36, 12), GW, GH), netMat); back.position.copy(p(bx, W / 2, GH / 2)); back.rotation.y = Math.PI / 2; S.add(back);
    const top = new THREE.Mesh(sq(new THREE.PlaneGeometry(GW, GD, 36, 10), GW, GD), netMat); top.position.copy(p(gx + dir * GD / 2, W / 2, GH)); top.rotation.set(-Math.PI / 2, 0, Math.PI / 2); S.add(top);
    const sds = [y0, y1].map(yy => { const sd = new THREE.Mesh(sq(new THREE.PlaneGeometry(GD, GH, 14, 12), GD, GH), netMat); sd.position.copy(p(gx + dir * GD / 2, yy, GH / 2)); S.add(sd); return sd; });
    // cada paño de red se deforma hacia fuera donde pega el balón
    const reg = (mesh, part, out) => { mesh.updateMatrixWorld(true); const ar = mesh.geometry.attributes.position, wpos = new Float32Array(ar.count * 3), v = new THREE.Vector3();
      for (let i = 0; i < ar.count; i++) { v.fromBufferAttribute(ar, i).applyMatrix4(mesh.matrixWorld); wpos[i * 3] = v.x; wpos[i * 3 + 1] = v.y; wpos[i * 3 + 2] = v.z; }
      const zw = new THREE.Vector3(0, 0, 1).transformDirection(mesh.matrixWorld); nets.push({ side, part, mesh, base: ar.array.slice(), wpos, sgn: Math.sign(zw.dot(out)) || 1, hit: 0 }); };
    reg(back, "back", new THREE.Vector3(dir, 0, 0)); reg(top, "top", new THREE.Vector3(0, 1, 0)); reg(sds[0], "s0", new THREE.Vector3(0, 0, -1)); reg(sds[1], "s1", new THREE.Vector3(0, 0, 1));
  }
  setLoad("estadio");
  const white = new THREE.MeshStandardMaterial({ color: 0xf4f4f0, roughness: .35, metalness: .3 });
  const pitch = STREET ? await loadTex("st_suelo") : await loadTex("campo2"); const F = STREET ? { x0: -1, y0: -1, w: L + 2, h: W + 2 } : { x0: -3, y0: -3, w: 111, h: 74 };
  const CANCHA = STREET && !PLAYA; if (CANCHA) { const ct = await loadTex("st_cancha"); pitch.image = ct.image; pitch.needsUpdate = true; pitch.repeat.set(.9287 * (L + 2) / L, .8908 * (W + 2) / W); pitch.offset.set(37 / 1024 - .9287 / L, .0555 - .8908 / W); }   // cancha pintada (imagen de Guille): líneas ajustadas a 40 x 22
  else if (STREET) { pitch.wrapS = pitch.wrapT = THREE.RepeatWrapping; pitch.repeat.set(L / 8, W / 8); }   // césped nuevo, recalibrado a 14 px/m con las líneas en su sitio
  const gMat = new THREE.MeshStandardMaterial({ map: pitch, roughness: .9, color: PLAYA ? new THREE.Color(1.25, 1.05, .72) : CANCHA ? new THREE.Color(.8, .82, .86) : STREET ? new THREE.Color(.42, .44, .48) : new THREE.Color(.7, .77, .68) });
  // detalle fino del césped (ruido por posición): da textura de hierba de cerca sin imágenes nuevas
  if (!STREET) gMat.onBeforeCompile = sh => { sh.vertexShader = "varying vec3 vWP;\n" + sh.vertexShader.replace("#include <worldpos_vertex>", "#include <worldpos_vertex>\n vWP = (modelMatrix * vec4(transformed, 1.)).xyz;");
    sh.fragmentShader = "varying vec3 vWP;\nfloat h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }\nfloat vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }\n" + sh.fragmentShader.replace("#include <map_fragment>", "#include <map_fragment>\n { float lg = dot(diffuseColor.rgb, vec3(.299,.587,.114)); diffuseColor.rgb = mix(vec3(lg), diffuseColor.rgb, .78) * vec3(.97, 1., .95); }\n { float n = vn(vWP.xz * 3.1) * .55 + vn(vWP.xz * 11.) * .3 + vn(vWP.xz * .6) * .15; diffuseColor.rgb *= .9 + n * .2; }"); };
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(F.w, F.h), gMat);
  ground.rotation.x = -Math.PI / 2; ground.position.copy(P3(F.x0 + F.w / 2, F.y0 + F.h / 2, 0)); ground.receiveShadow = true; S.add(ground);
  const hm = STREET ? await loadTex("st_hormigon") : null; if (hm) { hm.wrapS = hm.wrapT = THREE.RepeatWrapping; hm.repeat.set(17, 13); }
  const outer = new THREE.Mesh(new THREE.PlaneGeometry(170, 130), new THREE.MeshStandardMaterial(hm ? { map: hm, color: 0x9a9a9e, roughness: 1 } : { color: STREET ? 0x3b3a3d : 0x2e5a22, roughness: 1 })); outer.rotation.x = -Math.PI / 2; outer.position.y = -.02; outer.receiveShadow = true; S.add(outer);
  const nt = await loadTex("red", false); nt.wrapS = nt.wrapT = THREE.RepeatWrapping;
  const netMat = new THREE.MeshStandardMaterial({ color: 0xffffff, alphaMap: nt, transparent: true, alphaTest: .15, side: THREE.DoubleSide, roughness: .9, depthWrite: false });
  goal(0, netMat, white); goal(1, netMat, white);
  const vt = await loadTex("vallas"); vt.wrapS = THREE.RepeatWrapping;
  const board = (len, x, y, ry) => { const t = vt.clone(); t.needsUpdate = true; t.repeat.set(len / 9.1, 1);
    const m = new THREE.Mesh(new THREE.BoxGeometry(len, 1, .12), [0, 1, 2, 3].map(() => new THREE.MeshStandardMaterial({ color: 0x15171c })).concat([new THREE.MeshStandardMaterial({ map: t, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: .55, roughness: .6 }), new THREE.MeshStandardMaterial({ color: 0x15171c })]));
    m.position.copy(P3(x, y, .5)); m.rotation.y = ry; S.add(m); };
  if (!STREET) { board(L + 6, L / 2, -5.5, 0); board(W - 8, -5.5, W / 2, Math.PI / 2); board(W - 8, L + 5.5, W / 2, -Math.PI / 2); board(L + 6, L / 2, W + 5.5, Math.PI); }
  else { // jaula: vallas de publicidad pegadas a las líneas, red hasta 4 m, postes y líneas pintadas; alrededor, las fachadas del barrio
    const wb = .35; board(L + 2 * wb, L / 2, -wb, 0); board(L + 2 * wb, L / 2, W + wb, Math.PI); for (const x of [-wb, L + wb]) { const ry = x < 0 ? Math.PI / 2 : -Math.PI / 2, l2 = (W - GW) / 2; board(l2, x, l2 / 2, ry); board(l2, x, W - l2 / 2, ry); }
    const lineM = new THREE.MeshBasicMaterial({ color: 0xeeeeee }), ln = (w, d, x, y) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), lineM); m.rotation.x = -Math.PI / 2; m.position.copy(P3(x, y, .012)); S.add(m); };
    ln(.1, W, L / 2, W / 2); const ring = new THREE.Mesh(new THREE.RingGeometry(3, 3.1, 48), lineM); ring.rotation.x = -Math.PI / 2; ring.position.copy(P3(L / 2, W / 2, .012)); S.add(ring);
    for (const x0 of [0, L]) { const s2 = x0 ? -1 : 1; ln(.1, 9, x0 + s2 * 6, W / 2); ln(6, .1, x0 + s2 * 3, W / 2 - 4.5); ln(6, .1, x0 + s2 * 3, W / 2 + 4.5); }
    const cnt = new THREE.MeshStandardMaterial({ color: 0xdddddd, alphaMap: nt.clone(), transparent: true, alphaTest: .2, side: THREE.DoubleSide, depthWrite: false }); cnt.alphaMap.repeat.set(30, 4); cnt.alphaMap.needsUpdate = true;
    for (const [w, x, y, ry] of [[L, L / 2, -.5, 0], [W, -.5, W / 2, Math.PI / 2], [W, L + .5, W / 2, Math.PI / 2]]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w + 1, 3), cnt); m.position.copy(P3(x, y, 2.5)); m.rotation.y = ry; S.add(m); }
    const metal = new THREE.MeshStandardMaterial({ color: 0x30343a, metalness: .7, roughness: .4 });
    for (let x = 0; x <= L + .1; x += 5) for (const y of [-.5]) cyl(P3(x, y, 0), P3(x, y, 4), .06, metal);
    for (const x of [-.5, L + .5]) for (let y = 0; y <= W - 5; y += 5.5) cyl(P3(x, y, 0), P3(x, y, 4), .06, metal);
    // barrio: bloques con fachadas de las imágenes de Guille
    const FAC = await Promise.all(["st_f6", "st_f5", "st_f3", "st_f2", "st_f1", "st_f7", "st_f4", "st_f8"].map(n => loadTex(n))), sideT = await loadTex("st_ladr"); sideT.wrapS = sideT.wrapT = THREE.RepeatWrapping; sideT.repeat.set(3, 3);
    const sideM = new THREE.MeshStandardMaterial({ map: sideT, roughness: .95 }), roofM = new THREE.MeshStandardMaterial({ color: 0x4a4440, roughness: .9 }), acera = await loadTex("st_acera"); acera.wrapS = acera.wrapT = THREE.RepeatWrapping;
    const blk = (x, y, w, h, d, ry, f) => { const fm = new THREE.MeshStandardMaterial({ map: FAC[f % FAC.length], roughness: .9 }), m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [sideM, sideM, roofM, roofM, fm, sideM]); m.position.copy(P3(x, y, h / 2)); m.rotation.y = ry; m.receiveShadow = true; S.add(m); };
    let k = 0; for (let x = -10; x < L + 12; x += 13) { blk(x, -16, 12.6, 9 + (k * 7 % 6), 12, 0, k); blk(x, W + 16, 12.6, 10 + (k * 5 % 5), 12, Math.PI, k + 3); k++; }
    for (let y = -6; y < W + 8; y += 13) { blk(-17, y, 12.6, 11 + (k % 4), 12, -Math.PI / 2 + Math.PI, k); blk(L + 17, y, 12.6, 9 + (k % 5), 12, -Math.PI / 2, k + 2); k++; }
    const sw = new THREE.Mesh(new THREE.PlaneGeometry(L + 22, W + 18), new THREE.MeshStandardMaterial({ map: acera, roughness: 1, color: 0x9a9a9a })); acera.repeat.set((L + 22) / 3, (W + 18) / 3); sw.rotation.x = -Math.PI / 2; sw.position.copy(P3(L / 2, W / 2, -.01)); sw.receiveShadow = true; S.add(sw); }
  const conc = new THREE.MeshStandardMaterial({ color: 0x8b8f96, roughness: .95 }), seat = new THREE.MeshStandardMaterial({ color: 0x35507a, roughness: .8 });
  // piezas del estadio hechas con Meshy: torres de focos, banquillos y videomarcador
  const PC = {};
  async function prop(n, size, axis, x, y, z, ry) { try { PC[n] = PC[n] || new GLTFLoader().parseAsync(b64buf(await asset("m_" + n)), ""); const g = await PC[n]; const o = g.scene.clone(), bb = new THREE.Box3().setFromObject(o), sz = bb.getSize(new THREE.Vector3());
      const k = size / sz[axis]; o.scale.setScalar(k); o.position.set(-(bb.min.x + sz.x / 2) * k, -bb.min.y * k, -(bb.min.z + sz.z / 2) * k);
      const w = new THREE.Group(); w.add(o); w.position.copy(P3(x, y, z)); w.rotation.y = ry; o.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); S.add(w); return w; } catch (e) { console.warn(n, e); } }
  // gradas: módulo de Meshy repetido en dos anillos (abajo y arriba) en tres lados, con cubierta
  setLoad("gradas");
  const STANDS = []; window.EST2_SEATS = null;
  const EST2 = !STREET && !/clasico/.test(location.search) && await (async () => { try {
      const g = await new GLTFLoader().parseAsync(b64buf(await asset("m_estadio2")), ""), m = g.scene, SX = .0262, SY = .025, SZ = .0311;
      m.scale.set(SX, SY, SZ); m.position.set(0, -38 * SY - .04, 0); m.updateMatrixWorld(true);
      m.traverse(o => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; if (!o.geometry.attributes.normal) o.geometry.computeVertexNormals(); const mt = o.material; if (!mt) return;
        if (mt.map) o.material = new THREE.MeshLambertMaterial({ map: mt.map, color: 0xb4b8be, emissive: 0x7a7e86, emissiveMap: mt.map, side: THREE.DoubleSide });
        else { const az = /azul/.test(mt.name); o.material = new THREE.MeshLambertMaterial({ color: az ? 0x8a2030 : 0x56627a, emissive: az ? 0x4a121a : 0x343c4e, side: THREE.DoubleSide }); } } }); S.add(m);
      // puntos donde se sienta el público (calculados sobre las gradas del modelo)
      const raw = JSON.parse(await asset("estadio2_seats")), pts = []; for (let i = 0; i < raw.length; i += 3) pts.push(new THREE.Vector3(raw[i] * SX, raw[i + 1] * SY - 38 * SY - .04 + .05, raw[i + 2] * SZ));
      window.EST2_SEATS = pts; window.EST2 = m; return true; } catch (e) { console.warn("estadio nuevo", e); return false; } })();
  if (!STREET && !EST2) { const g = await new GLTFLoader().parseAsync(b64buf(await asset("m_est_grada")), ""), src = g.scene, bb = new THREE.Box3().setFromObject(src), sz = bb.getSize(new THREE.Vector3());
    src.traverse(m => { if (m.isMesh) m.receiveShadow = true; });
    const roofM = new THREE.MeshStandardMaterial({ color: 0xdfe3e9, roughness: .7, metalness: .1, emissive: 0x7d838d }), wallM = new THREE.MeshStandardMaterial({ color: 0xbfc4cc, roughness: .95, emissive: 0x5d626b }),
      fasM = new THREE.MeshStandardMaterial({ color: 0xf4f6fa, roughness: .5, emissive: 0xb8bec8 }), lampM = new THREE.MeshBasicMaterial({ color: 0xfff6dc, toneMapped: false });
    const side = (cx, cy, len, rot, e0 = 0, e1 = 0, nr = false) => { const grp = new THREE.Group(); grp.position.copy(P3(cx, cy, 0)); grp.rotation.y = rot; S.add(grp);
      const n = Math.max(1, Math.round(len / 13)), tw = len / n, k = tw / sz.x, d = sz.z * k, h = sz.y * k;
      for (let ring = 0; ring < 2; ring++) for (let i = 0; i < n; i++) { const o = src.clone(); o.scale.setScalar(k); o.position.set(-len / 2 + tw * (i + .5) - (bb.min.x + sz.x / 2) * k, -bb.min.y * k + ring * (h - .6), -d / 2 - (bb.min.z + sz.z / 2) * k - ring * (d - .4)); grp.add(o); STANDS.push(o); }
      e0 = e0 && 2 * d + 10; e1 = e1 && 2 * d + 10; const ox = (e1 - e0) / 2;
      const back = new THREE.Mesh(new THREE.BoxGeometry(len + e0 + e1, 2 * h + 6, .6), wallM); back.position.set(ox, h + 3, -2 * d - .2); 
      const roof = new THREE.Mesh(new THREE.BoxGeometry(len + 2 + e0 + e1, .9, 2 * d + 4), roofM); roof.position.set(ox, 2 * h + 6, -d); roof.rotation.x = -.06;
      const fas = new THREE.Mesh(new THREE.BoxGeometry(len + 2 + e0 + e1, 1.6, .5), fasM); fas.position.set(ox, 2 * h + 6.2 - (d + 2) * .06, 2.1);   // frontal de la cubierta
      if (nr) return; grp.add(roof); grp.add(back); grp.add(fas);
      { const n2 = Math.max(4, Math.round((len + e0 + e1) / 7)); for (let i = 0; i < n2; i++) { const lp = new THREE.Mesh(new THREE.BoxGeometry(1.6, .35, .5), lampM); lp.position.set(ox - (len + e0 + e1) / 2 + (i + .5) * (len + e0 + e1) / n2, 2 * h + 5.15 - (d + 2) * .06, 1.9); grp.add(lp); } } };   // focos bajo la cubierta
    side(L / 2, -7.6, L + 14, 0, 1, 1); side(-7.6, W / 2, W - 2, Math.PI / 2, 0, 1); side(L + 7.6, W / 2, W - 2, -Math.PI / 2, 1, 0);
    // esquinas: un tramo de grada en diagonal para cerrar el hueco entre la tribuna y los fondos
    side(-7.4, -7.4, 18, Math.PI / 4, 0, 0, true); side(L + 7.4, -7.4, 18, -Math.PI / 4, 0, 0, true); }
  // esquinas cerradas (módulo de esquina de Meshy) para que no se vea el hueco entre gradas
  setLoad("estadio (focos y banquillos)");
  if (!STREET && !EST2) for (const [x, y] of [[-22, -26], [L + 22, -26], [-22, W + 24], [L + 22, W + 24]]) await prop("est_foco", 42, "y", x, y, 0, Math.atan2(W / 2 - y, L / 2 - x));
  if (!STREET) for (const bx of [L / 2 - 11, L / 2 + 11]) await prop("est_banquillo", 7, "x", bx, -3.4, 0, 0);
  if (!STREET && !EST2) { // videomarcadores (imagen de Guille) con el resultado en directo
    const vim = await new Promise(res => { asset("videomarcador").then(u => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = u; }); });
    const vc = document.createElement("canvas"); vc.width = 831; vc.height = 518; const vg = vc.getContext("2d"), vt = new THREE.CanvasTexture(vc); vt.colorSpace = THREE.SRGBColorSpace; vt.anisotropy = 4;
    window.__vb = (a, b, s0, s1, ck, h, c0, c1) => { vg.clearRect(0, 0, 831, 518); if (vim) vg.drawImage(vim, 0, 0); else { vg.fillStyle = "#111"; vg.fillRect(0, 0, 831, 518); }
      const X = 68, Y = 57, Wd = 697, Hd = 405; vg.fillStyle = "#06101f"; vg.fillRect(X, Y, Wd, Hd); vg.textAlign = "center"; vg.textBaseline = "middle";
      vg.fillStyle = c0 || "#1e6bff"; vg.fillRect(X + 40, Y + 70, 16, 90); vg.fillStyle = c1 || "#e11d2e"; vg.fillRect(X + Wd - 56, Y + 70, 16, 90);
      vg.fillStyle = "#fff"; vg.font = "900 64px system-ui,sans-serif"; vg.fillText(String(a || "").slice(0, 4), X + 160, Y + 115); vg.fillText(String(b || "").slice(0, 4), X + Wd - 160, Y + 115);
      vg.font = "900 150px system-ui,sans-serif"; vg.fillText(s0 + " - " + s1, X + Wd / 2, Y + 235); vg.fillStyle = "#ffd23a"; vg.font = "800 54px system-ui,sans-serif"; vg.fillText(ck || "00'", X + Wd / 2, Y + 345);
      vg.fillStyle = "#9fb3d9"; vg.font = "700 30px system-ui,sans-serif"; vg.fillText(h || "", X + Wd / 2, Y + 30 + 0); vt.needsUpdate = true; };
    window.__vb("", "", 0, 0, "00'", "", null, null);
    const vm = new THREE.MeshBasicMaterial({ map: vt, toneMapped: false, transparent: true, alphaTest: .05, side: THREE.DoubleSide }), vw = 20, vh = vw * 518 / 831;
    const legM = new THREE.MeshStandardMaterial({ color: 0x1b1d22, roughness: .6, metalness: .5 });
    for (const [x, sd] of [[L + 15, 1], [-15, -1]]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(vw, vh), vm); m.position.copy(P3(x, W / 2, 19 + vh / 2)); m.lookAt(P3(L / 2, W / 2, 19 + vh / 2)); S.add(m);
      for (const dy of [-vw * .38, vw * .38]) { const leg = new THREE.Mesh(new THREE.BoxGeometry(.8, 19, .8), legM); leg.position.copy(P3(x + sd * .5, W / 2 + dy, 9.5)); S.add(leg); } }
  }
  // estadio barato de pintar: lejos de la sombra del sol, sin recibir ni proyectar sombras y con material Lambert (mucho menos trabajo por píxel)
  { const lam = new Map(); S.traverse(o => { if (!o.isMesh || o === ground) return; const far = o.getWorldPosition(new THREE.Vector3()); if (Math.abs(far.x) < L / 2 + 2 && Math.abs(far.z) < W / 2 + 2) return;
      o.castShadow = false; o.receiveShadow = false; const m = o.material; if (m && m.isMeshStandardMaterial && !m.alphaMap) { let n = lam.get(m); if (!n) { n = new THREE.MeshLambertMaterial({ map: m.map, color: m.color, emissive: m.emissive, emissiveMap: m.emissiveMap, emissiveIntensity: m.emissiveIntensity, transparent: m.transparent, alphaTest: m.alphaTest, side: m.side }); lam.set(m, n); } o.material = n; } }); }
  const ballMesh = new THREE.Mesh(new THREE.SphereGeometry(BR, 28, 20), new THREE.MeshStandardMaterial({ map: await loadTex("balon"), roughness: .45 })); ballMesh.castShadow = true; S.add(ballMesh);

  /* ---------- animaciones ---------- */
  setLoad("animaciones");
  const GL = () => new GLTFLoader();
  const an = await GL().parseAsync(b64buf(await asset("m_mx")), "");
  const animRest = {}; let hipsRestY = 1; an.scene.traverse(o => { if (o.name) animRest[o.name] = o.quaternion.clone(); if (o.name === "Hips") hipsRestY = o.position.y; });
  const baseClips = {}; for (const c of an.animations) { c.tracks = c.tracks.filter(t => !t.name.endsWith(".scale") && (!t.name.endsWith(".position") || t.name === "Hips.position")); baseClips[c.name] = c; }
  // retarget de un clip al esqueleto de un modelo (se hace solo cuando se usa: carga mucho más rápida)
  function clipOne(g, n) {
    const R = g.__rt || (g.__rt = (() => { let hips = null; const rest = {}; g.scene.traverse(o => { if (o.isBone) { rest[o.name] = o.quaternion.clone(); if (!hips && o.name === "Hips") hips = o; } }); return { hips, rest }; })());
    const c = baseClips[n]; if (!c) return null; const k = c.clone(), qa = new THREE.Quaternion(), qr = new THREE.Quaternion(), rest = R.rest, hips = R.hips;
    for (const tr of k.tracks) { const bn = tr.name.split(".")[0];
      if (tr.name.endsWith(".quaternion") && rest[bn] && animRest[bn]) { qr.copy(animRest[bn]).invert(); const v = tr.values = tr.values.slice(); for (let i = 0; i < v.length; i += 4) { qa.fromArray(v, i); qa.premultiply(qr).premultiply(rest[bn]); qa.toArray(v, i); } }
      else if (tr.name === "Hips.position" && hips) { const v = tr.values = tr.values.slice(); for (let i = 0; i < v.length; i += 3) { v[i] = hips.position.x; v[i + 1] += hips.position.y - hipsRestY; v[i + 2] = hips.position.z; } } }
    return k;
  }
  function clipsFor(g) {
    const out = {}; for (const n of Object.keys(baseClips)) out[n] = clipOne(g, n);
    return out;
  }


  /* =====================================================================================
     PARTIDO 11 CONTRA 11
     ===================================================================================== */
  const LOC = n => { const m = META[n]; return { n, dur: m.dur, cyc: 1, lph: m.lfw || 0, touch: m.touch || [] }; };
  const FWD = [ Object.assign(LOC("StandardIdle"), { v: 0 }), Object.assign(LOC("StandardWalk"), { v: 1.49 }), Object.assign(LOC("JogForward"), { v: 2.46 }), Object.assign(LOC("StandardRun"), { v: 4.12 }), Object.assign(LOC("Running"), { v: 5.61 }), Object.assign(LOC("SprintForward"), { v: 6.9 }) ];
  const FWDb = [Object.assign(LOC("BreathingIdle"), { v: 0 })].concat(FWD.slice(1)), FWDc = [Object.assign(LOC("SoccerIdle"), { v: 0 })].concat(FWD.slice(1)), FWDS = [FWD, FWDb, FWDc];
  const SIDE = { back: Object.assign(LOC("JogBackward"), { v: 2.26 }), left: Object.assign(LOC("JogStrafeLeft"), { v: 2.86 }), right: Object.assign(LOC("JogStrafeRight"), { v: 2.31 }) };
  const INJ = [ Object.assign(LOC("StandardIdle"), { v: 0 }), Object.assign(LOC("InjuredWalking"), { v: 1.7 }) ];
  const GKT = [ Object.assign(LOC("GoalkeeperIdle"), { v: 0 }), Object.assign(LOC("GoalkeeperSidestep"), { v: 2.4 }) ];

  /* ---------- equipaciones: el tinte se aplica sobre camiseta (verde) y pantalón (azul) del modelo ---------- */
  const numTex = (n, c1) => { const cv = document.createElement("canvas"); cv.width = cv.height = 128; const g = cv.getContext("2d"); const light = new THREE.Color(c1).getHSL({}).l > .62;
    g.font = "900 96px Arial Black, Arial, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.lineWidth = 8; g.strokeStyle = light ? "#ffffff" : "#111111"; g.fillStyle = light ? "#111827" : "#ffffff";
    g.strokeText(String(n), 64, 70); g.fillText(String(n), 64, 70); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t; };
  // diseños de camiseta (atlas 5x4: diseño k → delante 2k, detrás 2k+1); el rojo es el color 1 del club, el azul el 2 y el blanco los ribetes
  const PATT = await loadTex("camisetas").catch(() => null); if (PATT) { PATT.generateMipmaps = true; PATT.minFilter = THREE.LinearMipmapLinearFilter; }
  const CAL = Object.assign({ y0: .815, y1: .5, hw: .14, sl: .13 }, window.KITCAL || {});
  function kitMat(src, c1, c2, num, geo, des, c3) {
    const m = src.clone(); if (geo && !geo.boundingBox) geo.computeBoundingBox(); const bb = geo ? geo.boundingBox : null;
    const U = { k1: { value: new THREE.Color(c1) }, k2: { value: new THREE.Color(c2) }, k3: { value: new THREE.Color(c3 || c2) }, pT: { value: PATT }, des: { value: PATT && des != null ? des : -1 }, cal: { value: new THREE.Vector4(CAL.y0, CAL.y1, CAL.hw, CAL.sl) }, nuT: { value: num != null ? numTex(num, c1) : null }, hasN: { value: num != null ? 1 : 0 },
      bmin: { value: bb ? bb.min.clone() : new THREE.Vector3() }, bsz: { value: bb ? bb.getSize(new THREE.Vector3()) : new THREE.Vector3(1, 1, 1) } };
    m.onBeforeCompile = sh => { Object.assign(sh.uniforms, U);
      sh.vertexShader = "varying vec3 vB; varying vec3 vBN;\n" + sh.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\n vB = position; vBN = normal;");
      sh.fragmentShader = "uniform sampler2D pT; uniform float des; uniform vec4 cal; uniform vec3 k1; uniform vec3 k2; uniform vec3 k3; uniform sampler2D nuT; uniform float hasN; uniform vec3 bmin; uniform vec3 bsz; varying vec3 vB; varying vec3 vBN; float kShirt = 0.;\n" + sh.fragmentShader
        .replace("#include <roughnessmap_fragment>", "#include <roughnessmap_fragment>\n roughnessFactor = kShirt > .5 ? .72 : max(roughnessFactor, .62);")
        .replace("#include <opaque_fragment>", "{ float fr = 1. - max(dot(normalize(normal), normalize(vViewPosition)), 0.); outgoingLight += vec3(.85, .92, 1.) * pow(fr, 3.) * .2; }\n#include <opaque_fragment>")
        .replace("#include <map_fragment>", `#include <map_fragment>
      { vec3 c = diffuseColor.rgb; float mx = max(c.r, max(c.g, c.b)), mn = min(c.r, min(c.g, c.b)), sat = (mx - mn) / (mx + 1e-4);
        float shirt = step(c.r * 1.5, c.g) * step(c.b, c.g) * step(.18, sat);
        // marcas oscuras pintadas en el pecho (logos de la textura de Meshy): se tapan con el color de la camiseta
        { float H0 = bsz.y; vec2 q0 = vec2((vB.x - (bmin.x + bsz.x * .5)) / H0, (vB.y - bmin.y) / H0);
          if (vBN.z > 0. && abs(q0.x) < .1 && q0.y > .6 && q0.y < .82) { if (shirt > .5) mx = max(mx, .4); else if (mx < .3 && sat < .75) { shirt = 1.; c = vec3(.1, .45, .1); mx = .45; } } }
        float shorts = step(c.r * 1.15, c.b) * step(c.g, c.b) * step(.2, sat);
        float am = clamp((1. - diffuseColor.a) * 2., 0., 1.);
        float lum = clamp(mx / .5, .35, 1.3);
        vec3 kc = k1;
        if (des >= 0. && shirt > .5) { float H1 = bsz.y; vec2 q1 = vec2((vB.x - (bmin.x + bsz.x * .5)) / H1, (vB.y - bmin.y) / H1);
          float back = step(vBN.z, 0.), ax = abs(q1.x), sx = back > .5 ? -q1.x : q1.x; vec2 px;
          if (ax <= cal.z) px = vec2(627. + sx / cal.z * 343., 150. + (cal.x - q1.y) / (cal.x - cal.y) * 1025.);
          else { float d = clamp((ax - cal.z) / cal.w, 0., 1.); px = vec2(627. + sign(sx) * (360. + d * 230.), 300.); }
          px = clamp(px, vec2(4.), vec2(1250.)); float i = des * 2. + back; vec2 cell = vec2(mod(i, 5.), floor(i / 5.));
          vec3 pc = texture2D(pT, vec2((cell.x * 256. + px.x / 1254. * 256.) / 1280., 1. - (cell.y * 256. + px.y / 1254. * 256.) / 1024.)).rgb;
          kc = pc.b > .6 && pc.r < .4 ? k2 : pc.r > .6 && pc.g > .6 && pc.b > .6 ? vec3(.92) : k1; }
        kShirt = max(shirt, shorts); diffuseColor.rgb = mix(c, kc * lum, max(shirt, am * (1. - shorts)));
        diffuseColor.rgb = mix(diffuseColor.rgb, k3 * lum, shorts);
        if (hasN > .5 && shirt > .5) { float H = bsz.y; vec2 q = vec2((vB.x - (bmin.x + bsz.x * .5)) / H, (vB.y - bmin.y) / H);
          float bk = smoothstep(.15, .45, -vBN.z); vec2 nu = vec2(1. - (q.x + .075) / .15, (q.y - .58) / .13);
          if (bk > 0. && nu.x > 0. && nu.x < 1. && nu.y > 0. && nu.y < 1.) { vec4 t = texture2D(nuT, nu); diffuseColor.rgb = mix(diffuseColor.rgb, t.rgb, t.a * bk); } }
        diffuseColor.a = 1.; }`); };
    m.transparent = false; m.alphaTest = 0; m.needsUpdate = true; return m;
  }
  // normales suavizadas: los modelos de Meshy vienen con caras planas (se ven a facetas); se promedian por posición sin romper las costuras de UV
  function smoothN(geo) { const P_ = geo.attributes.position, N = geo.attributes.normal; if (!P_ || !N) return; const acc = new Map(), key = i => Math.round(P_.getX(i) * 1e4) + "," + Math.round(P_.getY(i) * 1e4) + "," + Math.round(P_.getZ(i) * 1e4);
    if (!geo.index) return; const ix = geo.index.array, sum = new Float32Array(P_.count * 3), a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
    for (let f = 0; f < ix.length; f += 3) { const i0 = ix[f], i1 = ix[f + 1], i2 = ix[f + 2]; a.fromBufferAttribute(P_, i0); b.fromBufferAttribute(P_, i1); c.fromBufferAttribute(P_, i2); b.sub(a); c.sub(a); b.cross(c); for (const i of [i0, i1, i2]) { sum[i * 3] += b.x; sum[i * 3 + 1] += b.y; sum[i * 3 + 2] += b.z; } }
    for (let i = 0; i < P_.count; i++) { const k = key(i); let e = acc.get(k); if (!e) acc.set(k, e = [0, 0, 0]); e[0] += sum[i * 3]; e[1] += sum[i * 3 + 1]; e[2] += sum[i * 3 + 2]; }
    for (let i = 0; i < P_.count; i++) { const e = acc.get(key(i)), l = Math.hypot(e[0], e[1], e[2]) || 1; N.setXYZ(i, e[0] / l, e[1] / l, e[2] / l); } N.needsUpdate = true; }
  const WARM_L = ["Receive", "Receive_M", "BreathingIdle", "SoccerIdle", "SoccerTackle2", "GoalkeeperMiss", "GoalkeeperDropKick", "SoccerPenaltyKick", "FistPump", "StandingFistPump", "KneelingPointing", "Rallying", "StandingCheering", "Excited", "InjuredWalking", "Quick180Turn", "StandingArguing", "ShoveReaction", "JoggingStumble", "SoccerSpin", "StallSoccerball", "ScissorKick", "ScissorKick_M", "GoalkeeperCatch1", "GoalkeeperCatch2", "Cheering", "Chip", "Clapping", "Disappointed", "FallFlat", "GettingUp", "GoalkeeperBodyBlock", "GoalkeeperBodyBlock1", "GoalkeeperCatch", "GoalkeeperDivingSave", "GoalkeeperDivingSave1", "GoalkeeperIdle", "GoalkeeperOverhandThrow", "GoalkeeperScoop", "GoalkeeperSidestep", "JogBackward", "JogForward", "JogStrafeLeft", "JogStrafeRight", "KickSoccerball1", "KneeingSoccerball", "Pointing", "ReceiveSoccerball", "Running", "RunningSlide", "SoccerHeader", "SoccerPass", "SoccerTackle", "SoccerTrip", "SprintForward", "StandardIdle", "StandardRun", "StandardWalk", "StrikeFowardJog", "ThrowIn", "Victory", "Chip_M", "KickSoccerball1_M", "KneeingSoccerball_M", "ReceiveSoccerball_M", "SoccerHeader_M", "SoccerPass_M", "SoccerTackle_M", "StrikeFowardJog_M"];
  const MODELS = {}, CLIPS = {};
  // LOD (como DLS/FIFA): cada modelo de jugador tiene dos versiones simplificadas que comparten huesos, pesos y texturas; de lejos se pinta la de menos triángulos
  async function lodBuild(root) {
    const MS = window.MeshoptSimplifier; if (!MS) return; try { await MS.ready; } catch (e) { return; }
    root.traverse(o => { if (!o.isMesh || !o.geometry.index || o.geometry.userData.lod) return; const g = o.geometry, P_ = g.attributes.position, n = P_.count, pos = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { pos[i * 3] = P_.getX(i); pos[i * 3 + 1] = P_.getY(i); pos[i * 3 + 2] = P_.getZ(i); }
      const idx = new Uint32Array(g.index.array), mk = (r, e) => { try { const [ix] = MS.simplify(idx, pos, 3, Math.max(300, Math.floor(idx.length * r / 3) * 3), e, ["LockBorder"]); if (ix.length >= idx.length * .9) return null;
          const lg = new THREE.BufferGeometry(); for (const k in g.attributes) lg.setAttribute(k, g.attributes[k]); lg.morphAttributes = g.morphAttributes; lg.setIndex(new THREE.BufferAttribute(ix, 1)); if (!g.boundingBox) g.computeBoundingBox(); lg.boundingBox = g.boundingBox; lg.boundingSphere = g.boundingSphere; lg.userData.lodOf = g; return lg; } catch (e) { return null; } };
      g.userData.lod = [g, mk(.4, .01) || g, mk(.16, .03) || g]; });
  }
  // elige el nivel de detalle por el tamaño del jugador en pantalla (en píxeles)
  let lodOn = !/lod=0/.test(location.search);
  // sombras de mancha (como en los juegos de móvil): un círculo oscuro bajo cada jugador cuando no hay sombras reales
  const BLOB = (() => { const geo = new THREE.PlaneGeometry(1, 1); geo.rotateX(-Math.PI / 2);
    return { geo, mat: new THREE.ShaderMaterial({ transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, uniforms: {}, vertexShader: "varying vec2 vU; void main(){ vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }",
      fragmentShader: "varying vec2 vU; void main(){ float d = length(vU - .5) * 2.; gl_FragColor = vec4(0., 0., 0., (1. - smoothstep(.05, 1., d)) * .8); }" }) }; })();
  function blobFor(a, sz) { if (a.blob) return a.blob; const m = new THREE.Mesh(BLOB.geo, BLOB.mat); m.scale.set(sz, 1, sz); m.renderOrder = 1; m.frustumCulled = false; m.visible = false; S.add(m); return (a.blob = m); }
  function blobSel() { const sh = sun.castShadow && Rn.shadowMap.enabled;
    for (const a of ACT) { const real = sh && (a.inner.userData.cs ?? true), b = blobFor(a, 1.45); b.visible = !real && a.wrap.visible; if (b.visible) b.position.set(a.wrap.position.x, .07, a.wrap.position.z); }
    const bb = blobFor(window.__ballBlob || (window.__ballBlob = {}), .5); bb.visible = !sh && ballMesh.visible; if (bb.visible) { const z = Math.max(0, ballMesh.position.y - BR); bb.position.set(ballMesh.position.x, .071, ballMesh.position.z); const k = .5 + Math.min(1, z / 6) * .5; bb.scale.set(k, 1, k); } }
  // estadio con la luz "pintada": se calcula una vez la luz de cada vértice y se dibuja sin iluminación en tiempo real; luego se juntan las piezas por material (menos llamadas de dibujo)
  function bakeStatic() {
    const lights = []; S.traverse(o => { if (o.isLight) lights.push(o); }); S.updateMatrixWorld(true);
    const n = new THREE.Vector3(), d = new THREE.Vector3(), nm = new THREE.Matrix3(), c = new THREE.Color(), acc = new THREE.Color(), tmp = new THREE.Color();
    const light = (nx, ny, nz) => { acc.setRGB(0, 0, 0); for (const l of lights) { if (!l.visible) continue;
        if (l.isHemisphereLight) { const w = .5 * ny + .5; tmp.copy(l.groundColor).lerp(l.color, w).multiplyScalar(l.intensity); acc.add(tmp); }
        else if (l.isAmbientLight) { tmp.copy(l.color).multiplyScalar(l.intensity); acc.add(tmp); }
        else if (l.isDirectionalLight) { d.setFromMatrixPosition(l.matrixWorld).sub(n.setFromMatrixPosition(l.target.matrixWorld)).normalize(); const dl = Math.max(0, nx * d.x + ny * d.y + nz * d.z); if (dl > 0) { tmp.copy(l.color).multiplyScalar(l.intensity * dl); acc.add(tmp); } } }
      return acc.multiplyScalar(1 / Math.PI); };
    const groups = new Map(), done = new Map(); let nb = 0;
    S.traverse(o => { if (!o.isMesh || o.isSkinnedMesh || o.isInstancedMesh || !o.material || Array.isArray(o.material) || !o.material.isMeshLambertMaterial) return;
      const wp = o.getWorldPosition(new THREE.Vector3()); if (Math.abs(wp.x) < L / 2 + 2 && Math.abs(wp.z) < W / 2 + 2) return;
      const m = o.material; let g = o.geometry.clone();
      for (const k of ["position", "normal", "uv"]) { const at = g.attributes[k]; if (at && (at.normalized || !(at.array instanceof Float32Array) || at.isInterleavedBufferAttribute)) { const f = new Float32Array(at.count * at.itemSize); for (let i = 0; i < at.count; i++) for (let j = 0; j < at.itemSize; j++) f[i * at.itemSize + j] = at.getComponent ? at.getComponent(i, j) : [at.getX(i), at.getY(i), at.getZ(i)][j]; g.setAttribute(k, new THREE.BufferAttribute(f, at.itemSize)); } }   // modelos comprimidos (cuantizados): pasar a decimales antes de mover
      g.applyMatrix4(o.matrixWorld);
      if (!g.index && g.attributes.position.count > 30000 && window.mergeVertices) { for (const k of Object.keys(g.attributes)) if (k !== "position" && k !== "uv") g.deleteAttribute(k); g = window.mergeVertices(g, 1e-4); g.computeVertexNormals(); }   // soldar vértices para poder simplificar
      if (!g.attributes.normal) g.computeVertexNormals();
      const N = g.attributes.normal, cnt = g.attributes.position.count, col = new Float32Array(cnt * 3), em = m.emissive || new THREE.Color(0, 0, 0), ei = m.emissiveIntensity ?? 1;
      for (let i = 0; i < cnt; i++) { n.fromBufferAttribute(N, i).normalize(); light(n.x, n.y, n.z); c.copy(m.color).multiply(acc); c.r += em.r * ei; c.g += em.g * ei; c.b += em.b * ei; col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
      for (const k of Object.keys(g.attributes)) if (k !== "position" && k !== "uv") g.deleteAttribute(k); g.morphAttributes = {}; g.setAttribute("color", new THREE.BufferAttribute(col, 3));
      if (m.map && !g.attributes.uv) return; if (!m.map && g.attributes.uv) g.deleteAttribute("uv"); if (!g.index) { const ix = new Uint32Array(cnt); for (let i = 0; i < cnt; i++) ix[i] = i; g.setIndex(new THREE.BufferAttribute(ix, 1)); }
      let bm = done.get(m); if (!bm) { bm = new THREE.MeshBasicMaterial({ map: m.map || null, vertexColors: true, transparent: m.transparent, alphaTest: m.alphaTest, side: m.side, opacity: m.opacity }); done.set(m, bm); }
      const key = bm.uuid; if (!groups.has(key)) groups.set(key, { mat: bm, geos: [], objs: [] }); groups.get(key).geos.push(g); groups.get(key).objs.push(o); nb++; (window.__bakeL = window.__bakeL || []).push([o.name, Math.round(wp.x), Math.round(wp.z), cnt, !!m.map, m.transparent]); });
    let merged = 0; const mg = window.mergeGeometries;
    for (const { mat, geos, objs } of groups.values()) { let out = null; if (mg && geos.length > 1 && !mat.transparent) { try { out = mg(geos, false); } catch (e) { out = null; } }
      if (out) { for (const o of objs) { o.visible = false; if (o.parent) o.parent.remove(o); } const mm = new THREE.Mesh(out, mat); mm.matrixAutoUpdate = false; mm.updateMatrix(); S.add(mm); merged++; }
      else objs.forEach((o, i) => { o.material = mat; o.geometry.dispose ? null : null; const g = geos[i]; const inv = new THREE.Matrix4().copy(o.matrixWorld).invert(); g.applyMatrix4(inv); o.geometry = g; }); }
    return { piezas: nb, grupos: merged };
  }
  function lodSel() { if (!lodOn) return; const H = cv.height || 540, k = H / (2 * Math.tan(cam.fov * Math.PI / 360));
    for (const a of ACT) { const d = a.wrap.position.distanceTo(cam.position), px = 1.82 * k / Math.max(1, d), lv = px > 170 || a === M.human ? 0 : px > 75 ? 1 : 2;
      if (a.lodLv === lv) continue; a.lodLv = lv; a.inner.traverse(o => { if (o.isMesh && o.userData.lod) o.geometry = o.userData.lod[lv]; }); } }
  async function makeActor(modelName, kit, num, des) {
    if (!MODELS[modelName]) { MODELS[modelName] = await GL().parseAsync(b64buf(await asset("m_" + modelName)), ""); CLIPS[modelName] = {}; MODELS[modelName].scene.traverse(o => { if (o.isMesh) { smoothN(o.geometry); const mp = o.material && o.material.map, im = mp && mp.image;
        if (im && !mp.isCompressedTexture && im.width > TEXMAX) { const c = document.createElement("canvas"); c.width = c.height = TEXMAX; c.getContext("2d").drawImage(im, 0, 0, TEXMAX, TEXMAX); if (im.close) im.close(); mp.image = c; mp.needsUpdate = true; } } });
      await lodBuild(MODELS[modelName].scene); }
    const g = MODELS[modelName], wrap = new THREE.Group(), inner = THREE.SkeletonUtils ? THREE.SkeletonUtils.clone(g.scene) : SkeletonUtils.clone(g.scene);
    const bb = new THREE.Box3().setFromObject(g.scene), k = 1.82 / (bb.max.y - bb.min.y); inner.scale.setScalar(k); inner.position.y = -bb.min.y * k;
    inner.traverse(o => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; o.userData.lod = o.geometry.userData.lod || null; if (kit) o.material = kitMat(o.material, kit[0], kit[1], num, o.geometry, des, kit[2]); } }); wrap.add(inner); S.add(wrap);
    const mixer = new THREE.AnimationMixer(inner), acts = {};
    const act = n => acts[n] || (acts[n] = mixer.clipAction(CLIPS[modelName][n] || (CLIPS[modelName][n] = clipOne(MODELS[modelName], n))));
    const toes = { R: inner.getObjectByName("RightToeBase"), L: inner.getObjectByName("LeftToeBase") }, hands = [inner.getObjectByName("RightHand"), inner.getObjectByName("LeftHand")], head = inner.getObjectByName("Head");
    return { wrap, inner, mixer, act, acts, toes, hands, head, x: 0, y: 0, h: 0, mh: 0, v: 0, Phi: 0, prevPhi: 0, one: null, oneW: 0, lean: 0, sideW: { back: 0, left: 0, right: 0 }, idleT: Math.random() * 3, live: new Set() };
  }
  // pose: locomoción hacia delante (sincronizada por fase) + desplazamientos laterales/atrás + animación suelta encima
  function pose(a, dt, table) {
    const used = a.live; used.clear();
    const ow = a.one ? Math.min(1, a.oneW) : Math.max(0, a.oneW);
    const v = a.v; let i = 0; while (i < table.length - 2 && v > table[i + 1].v) i++;
    const A = table[i], B = table[i + 1], w = clamp((v - A.v) / (B.v - A.v), 0, 1);
    const vN = lerp(A.v, B.v, w), cA = A.dur / A.cyc, cB = B.dur / B.cyc, cyc = A.v === 0 ? cB : lerp(cA, cB, w);
    const rate = A.v === 0 ? (w > 0 ? Math.max(.55, v / B.v) : 0) : v / Math.max(.3, vN);
    a.prevPhi = a.Phi; a.Phi += dt / cyc * rate;
    // reparto entre ir de frente, de lado o hacia atrás según la diferencia entre mirada y marcha
    const rel = angD(a.h, a.mh), lat = table === GKT || v > 4.2 ? 0 : clamp((Math.abs(rel) - .7) / .6, 0, 1);
    const tb = lat * clamp(v / 1.2, 0, 1) * (Math.abs(rel) > 2.3 ? 1 : 0), tl = lat * clamp(v / 1.2, 0, 1) * (Math.abs(rel) <= 2.3 && rel < 0 ? 1 : 0), tr = lat * clamp(v / 1.2, 0, 1) * (Math.abs(rel) <= 2.3 && rel > 0 ? 1 : 0);
    const k = Math.min(1, dt * 7); a.sideW.back += (tb - a.sideW.back) * k; a.sideW.left += (tl - a.sideW.left) * k; a.sideW.right += (tr - a.sideW.right) * k;
    const sw = Math.min(1, a.sideW.back + a.sideW.left + a.sideW.right), lw = (1 - ow) * (1 - sw);
    const put = (n, wt, time) => { if (wt <= .002) return; const ac = a.act(n); used.add(n); if (!ac.isRunning()) ac.play(); ac.enabled = true; ac.paused = true; ac.setEffectiveWeight(wt); ac.time = time; };
    for (const [c, wt] of [[A, 1 - w], [B, w]]) put(c.n, wt * lw, c.v === 0 ? (a.idleT += dt * .5) % c.dur : (((c.lph + a.Phi / c.cyc) % 1 + 1) % 1) * c.dur);
    for (const s of ["back", "left", "right"]) { const c = SIDE[s], wt = a.sideW[s] * (1 - ow); if (wt > .002) { a.sPhi = (a.sPhi || 0) + dt * Math.max(.6, v / c.v) / c.dur * (s === "back" || s === "left" || s === "right" ? a.sideW[s] : 0); put(c.n, wt, ((a.sPhi % 1) + 1) % 1 * c.dur); } }
    a.locoA = A; a.locoB = B; a.locoW = w;
    const o = a.one || a.lastOne; if (o && (a.one || a.oneW > 0)) put(o.n, ow, Math.min(o.t, META[o.n].dur - 1e-3));
    // las acciones sin uso se quedan activas con peso 0 (no se recrean los enlaces de huesos: evita tirones)
    for (const n in a.acts) if (!used.has(n)) { const ac = a.acts[n]; if (ac.weight !== 0) ac.setEffectiveWeight(0); }
    a.pd = true;   // el esqueleto se calcula una sola vez por fotograma (o justo antes de leer un hueso)
  }
  function flushPose(a) { if (a.pd) { a.pd = false; a.mixer.update(0); } }
  function rmAt(m, t) { const r = m.rm; if (!r) return [0, 0]; const f = clamp(t * 15, 0, r.length - 1), i = Math.floor(f), j = Math.min(r.length - 1, i + 1), u = f - i; return [lerp(r[i][0], r[j][0], u), lerp(r[i][1], r[j][1], u)]; }
  function yawAt(m, t) { const r = m.yawC; if (!r) return 0; const f = clamp(t * 15, 0, r.length - 1), i = Math.floor(f), j = Math.min(r.length - 1, i + 1); return lerp(r[i], r[j], f - i); }
  function startOne(a, n, o = {}) { const m = META[n]; if (!m) return null; a.one = Object.assign({ n, t: o.t0 || 0, ts: o.ts || 1, m, h0: a.h, rmPrev: rmAt(m, o.t0 || 0), yawPrev: yawAt(m, o.t0 || 0) }, o); return a.one; }
  function stepOne(a, dt) {
    const o = a.one; if (!o) { a.oneW = Math.max(0, a.oneW - dt / .18); return; }
    if (o.freezeAt != null && o.t >= o.freezeAt) { o.t = o.freezeAt; o.ts = 0; }
    a.oneW = Math.min(1, a.oneW + dt / (o.fadeIn || .1));
    o.t += dt * o.ts; const end = o.end || o.m.dur;
    const r = rmAt(o.m, o.t), dx = r[0] - o.rmPrev[0], dz = r[1] - o.rmPrev[1]; o.rmPrev = r;
    const hx = Math.cos(o.h0), hy = Math.sin(o.h0);
    let mx = hx * dz + hy * dx, my = hy * dz - hx * dx; if (o.rootScale != null) { mx *= o.rootScale; my *= o.rootScale; }
    if (o.warp && o.t - (o.t0 || 0) <= o.warp.t) { mx += o.warp.x * dt * o.ts / o.warp.t; my += o.warp.y * dt * o.ts / o.warp.t; }
    a.x += mx; a.y += my;
    const yw = yawAt(o.m, o.t); a.h -= (yw - o.yawPrev); o.yawPrev = yw;
    if (o.turnTo != null && o.t < (o.turnT || .3)) a.h += angD(a.h, o.turnTo) * Math.min(1, dt * o.ts / Math.max(.05, (o.turnT || .3) - o.t + dt));
    a.v = Math.hypot(mx, my) / Math.max(dt, 1e-4); a.mh = a.h;
    if (o.during) o.during(o);
    if (o.onT && !o.fired && o.t >= o.onT) { o.fired = true; o.on(); }
    if (o.t >= end - (o.fadeOut || .15) * o.ts && (!o.onT || o.fired)) { a.lastOne = o; a.one = null; if (o.after) o.after(); }
  }
  function place(a) { a.wrap.position.copy(P3(a.x, a.y, 0)); a.wrap.rotation.set(0, -a.h + Math.PI / 2, 0, "YXZ"); a.inner.rotation.z = a.leanT && a.leanT.until > simT ? lerp(a.inner.rotation.z, a.leanT.v, .35) : a.lean; }

  /* ---------- equipos ---------- */
  const TEAMS = [ { name: "MDG27", short: "MDG", kit: ["#c8102e", "#f4f4f4"], gkModel: "gn01", score: 0, stats: { sh: 0, ont: 0, pa: 0, pc: 0, fo: 0, co: 0, off: 0, pos: 0 } },
                  { name: "ROCKET JAM", short: "RJM", kit: ["#1e40af", "#111827"], gkModel: "gn02", score: 0, stats: { sh: 0, ont: 0, pa: 0, pc: 0, fo: 0, co: 0, off: 0, pos: 0 } } ];
  // 4-3-3: profundidad (0 = portería propia, 1 = rival) y anchura (0..1)
  const F433 = [ ["POR", .0, .5], ["LI", .2, .12], ["DFC", .15, .37], ["DFC", .15, .63], ["LD", .2, .88], ["MC", .38, .3], ["MCD", .32, .5], ["MC", .38, .7], ["EI", .62, .14], ["DC", .66, .5], ["ED", .62, .86] ];
  const NAMES = [ ["Duarte", "Rivas", "Calleja", "Montoya", "Ferrer", "Salas", "Ibarra", "Vidal", "Toscano", "Lagos", "Peralta"], ["Okafor", "Brandt", "Lindqvist", "Moreau", "Kovač", "Halvorsen", "Esposito", "Nakamura", "Duval", "Mbaye", "Sørensen"] ];
  const PJM = window.PJM || ["pn01", "pn02", "pn03", "pn04", "pn05", "pn06", "pn07", "pn08", "pn09", "pn10", "pn11", "pn12", "pj01", "pj05", "pj02", "pj07", "pj11", "pj14", "pj03", "pj04", "pj06", "pj08"];
  // posiciones del juego → profundidad, categoría y anchura
  const ROLE = { POR: [0, "gk"], DFC: [.15, "def"], LI: [.2, "def", 1], LD: [.2, "def", 1], CAI: [.25, "def", 1], CAD: [.25, "def", 1], LTI: [.25, "def", 1], LTD: [.25, "def", 1], MCD: [.32, "mid"], MC: [.38, "mid"], MI: [.45, "mid"], MD: [.45, "mid"], MCO: [.5, "mid"], MP: [.5, "mid"], MO: [.55, "mid"], EI: [.62, "fwd"], ED: [.62, "fwd"], SD: [.64, "fwd"], DC: [.66, "fwd"] };
  const SIDE_W = { LI: .1, CAI: .1, LTI: .1, MI: .12, EI: .14, LD: .9, CAD: .9, LTD: .9, MD: .88, ED: .86 };
  /* ---------- ONLINE: sala con código; el anfitrión calcula el partido y el invitado manda sus botones y dibuja lo que le llega ---------- */
  const NQ = new URLSearchParams(location.search), NET = NQ.get("online") ? { host: false, guest: false, ws: null, ev: [], rin: null, ready: false, peer: false } : null; window.NET = NET;
  // servidores: Cloudflare primero; si no responde (bloqueos de LaLiga los fines de semana), la copia de Render
  const NET_LIST = (NQ.get("srv") ? [NQ.get("srv")] : ["https://mdg27-online.guidavilagri.workers.dev"].concat([window.MDG27_RESERVA || "https://mdg27-online.onrender.com"], ["https://mdg27-online.mineracats.workers.dev"])).map(u => u.replace(/\/$/, ""));
  let NET_SRV = NET_LIST[0];
  async function pickSrv() { for (const u of NET_LIST) { try { const c = new AbortController(), tm = setTimeout(() => c.abort(), u.includes("onrender") ? 70000 : 4000); const r = await fetch(u + "/ping", { signal: c.signal }); clearTimeout(tm); if (r.ok) { NET_SRV = u; return u; } } catch (e) {} } throw new Error("No hay conexión con el servidor online. Revisa internet y vuelve a intentarlo."); }
  function netSend(o) { try { if (NET && NET.ws && NET.ws.readyState === 1) NET.ws.send(JSON.stringify(o)); } catch (e) {} }
  async function netLobby() {
    const box = document.createElement("div"); Object.assign(box.style, { position: "fixed", inset: 0, display: "grid", placeItems: "center", background: "#050a14f2", zIndex: 50, color: "#fff", font: "600 16px system-ui", textAlign: "center", padding: "16px" }); document.body.appendChild(box);
    const B = (t, f) => { const b = document.createElement("button"); b.textContent = t; Object.assign(b.style, { font: "800 18px system-ui", padding: "12px 26px", minWidth: "240px", borderRadius: "10px", border: 0, background: "#ffd23a", color: "#111", cursor: "pointer", margin: "6px" }); b.onclick = f; return b; };
    const show = html => { box.innerHTML = `<div style="display:grid;gap:12px;justify-items:center;max-width:420px">${html}</div>`; return box.firstChild; };
    const connect = sala => new Promise((res, rej) => { const ws = new WebSocket(NET_SRV.replace(/^http/, "ws") + "/sala/" + sala + (STREET ? "?max=2" : "")); NET.ws = ws; NET.sala = sala;
      ws.onmessage = e => { let d; try { d = JSON.parse(e.data); } catch (er) { return; } netRecv(d); if (d.t === "hola") res(d); }; ws.onerror = () => rej(new Error("No se puede conectar con el servidor")); ws.onclose = () => { if (!NET.ended) netGone(); }; });
    return new Promise(done => {
      NET.onCfg = cfg => { box.remove(); done(cfg); };
      const home = () => { const w = show(`<h2 style="margin:0;font-size:30px;font-style:italic">PARTIDO ONLINE</h2><div style="opacity:.8">Juega contra un amigo en otro dispositivo</div>`);
        w.append(B("Crear sala", create), (() => { const d = document.createElement("div"); d.innerHTML = `<input id="ncode" maxlength="6" placeholder="CÓDIGO" style="font:800 22px system-ui;text-transform:uppercase;width:150px;text-align:center;padding:10px;border-radius:10px;border:0">`; d.append(B("Unirse", () => join($("#ncode").value.trim().toUpperCase()))); return d; })(), B("Volver", () => history.back())); };
      const fail = e => { const w = show(`<div style="color:#ff8a8a">${e.message || e}</div>`); w.append(B("Volver a intentarlo", home)); };
      const create = async () => { try { show("Conectando con el servidor…"); await pickSrv(); show("Creando sala…"); const r = await fetch(NET_SRV + "/nueva").then(x => x.json()); const h = await connect(r.sala); NET.host = h.host;
          show(`<div style="opacity:.8">Dile a tu amigo este código</div><div style="font:900 54px system-ui;letter-spacing:.12em;color:#ffd23a">${r.sala}</div><div>Esperando rival…</div>`); } catch (e) { fail(e); } };
      const join = async c => { if (!/^[A-Z0-9]{4,8}$/.test(c)) return fail(new Error("Código no válido")); try { show("Conectando con el servidor…"); await pickSrv(); show("Entrando en la sala " + c + "…"); const h = await connect(c); NET.host = h.host; NET.guest = !h.host; if (NET.guest) show("Conectado. Esperando al anfitrión…"); else show(`<div>La sala estaba vacía: eres el anfitrión</div><div style="font:900 54px system-ui;letter-spacing:.12em;color:#ffd23a">${c}</div><div>Esperando rival…</div>`); } catch (e) { fail(e); } };
      const auto = NQ.get("sala"); if (auto) join(auto.toUpperCase()); else home();
    });
  }
  function netCfg() { // configuración del partido que manda el anfitrión (los dos montan exactamente los mismos jugadores)
    const roles = STREET ? ["POR", "DFC", "EI", "ED"] : F433.map(f => f[0]);
    return { net: true, street: STREET, cpu: [], halfLen: STREET ? 150 : 240, tod: /noche/i.test(NQ.get("tod") || "") ? "Noche" : "Día", weather: NQ.get("clima") || "none",
      teams: [0, 1].map(t => ({ name: STREET ? (t ? "VISITANTES" : "LOCALES") : TEAMS[t].name, sh: STREET ? (t ? "VIS" : "LOC") : TEAMS[t].short, c1: TEAMS[t].kit[0], c2: TEAMS[t].kit[1], pl: roles.map((r, i) => ({ n: NAMES[t][i], role: r, num: [1, 3, 4, 5, 2, 8, 6, 10, 11, 9, 7][i] })) })) };
  }
  function netRecv(d) {
    if (d.t === "entra" && NET.host) { NET.peer = true; const cfg = netCfg(); netSend({ t: "cfg", cfg }); NET.onCfg && NET.onCfg(Object.assign({}, cfg, { human: 0 })); }
    else if (d.t === "cfg" && !NET.host) { if (!!d.cfg.street !== STREET) { location.href = location.pathname + "?online=1&sala=" + NET.sala + (d.cfg.street ? "&modo=street" : "") + (NQ.get("srv") ? "&srv=" + encodeURIComponent(NQ.get("srv")) : ""); return; } NET.peer = true; NET.onCfg && NET.onCfg(Object.assign({}, d.cfg, { human: 1 })); }
    else if (d.t === "listo") NET.ready = true;
    else if (d.t === "i") NET.rin = d;
    else if (d.t === "s") NET.snap = d;
    else if (d.t === "sale") netGone();
  }
  function netGone() { if (!NET || NET.ended) return; NET.ended = true; try { msg("El rival se ha desconectado", 4); } catch (e) {} if (window.__netEnd) window.__netEnd(); }
  const EMB = NET ? await netLobby() : await new Promise(res => { if (!/embed/.test(location.search)) return res(null); addEventListener("message", e => { if (e.data && e.data.type === "mdg27cfg") res(e.data.cfg); }); parent.postMessage({ type: "mdg27ready" }, "*"); });
  // ciudad deportiva: ejercicio de entrenamiento (si viene)
  const DRK = EMB && EMB.drill ? EMB.drill : new URLSearchParams(location.search).get("ejercicio"); if (DRK && window.__ldBg) window.__ldBg("carga_ciudad");
  const DR = DRK ? { k: DRK, cnt: 0, tries: 0, t: 0, state: "play", props: [], spots: new Map() } : null; window.DR = DR;
  const hex = c => { const m = /^#?([0-9a-f]{6})$/i.exec(c || ""); return m ? "#" + m[1] : null; };
  const lum = c => { const n = parseInt(c.slice(1), 16); return ((n >> 16) * .3 + ((n >> 8) & 255) * .59 + (n & 255) * .11) / 255; };
  if (EMB) { EMB.teams.forEach((td, t) => { TEAMS[t].name = td.name; TEAMS[t].short = (td.sh || td.name.slice(0, 3)).toUpperCase(); const k1 = hex(td.c1) || TEAMS[t].kit[0], k2 = hex(td.c2) || TEAMS[t].kit[1]; TEAMS[t].kit = [k1, k2];
      const K = td.kits; if (K && K[0] && hex(K[0].c1)) { const kk = o => [hex(o.c1), hex(o.c2) || hex(o.c1), hex(o.sh) || hex(o.c2) || hex(o.c1)]; TEAMS[t].kit = kk(K[0]); TEAMS[t].des = K[0].d; if (K[1] && hex(K[1].c1)) { TEAMS[t].away = kk(K[1]); TEAMS[t].awayD = K[1].d; } } });
    // color dominante de cada camiseta (con rayas o mitades cuenta también el 2º color)
    const domC = T => { const a = new THREE.Color(T.kit[0]); if ([0, 1, 2, 4, 7].includes(T.des)) a.lerp(new THREE.Color(T.kit[1]), .5); return a; };
    // ¿se confunden? distancia de color tipo «redmean» (cercana a como lo ve el ojo) entre el color dominante de cada camiseta, y también entre los colores principales
    const cdist = (a, b) => { const r = (a.r + b.r) / 2; return Math.sqrt((2 + r) * (a.r - b.r) ** 2 + 4 * (a.g - b.g) ** 2 + (3 - r) * (a.b - b.b) ** 2) / 3; };
    const lumC = c => .2126 * c.r + .7152 * c.g + .0722 * c.b;
    const near = () => { const a = domC(TEAMS[0]), b = domC(TEAMS[1]), a0 = new THREE.Color(TEAMS[0].kit[0]), b0 = new THREE.Color(TEAMS[1].kit[0]);
      return cdist(a, b) < .36 || cdist(a0, b0) < .3 || (lumC(a) > .78 && lumC(b) > .78) || (lumC(a) < .1 && lumC(b) < .1); };
    if (TEAMS[1].away && near()) { TEAMS[1].kit = TEAMS[1].away; TEAMS[1].des = TEAMS[1].awayD; }
    // si las camisetas se parecen, el visitante cambia a su segunda equipación
    if (near()) { TEAMS[1].kit = lum(TEAMS[0].kit[0]) > .55 ? ["#1f2937", "#111827", "#111827"] : ["#f4f4f4", TEAMS[1].kit[0], "#f4f4f4"]; TEAMS[1].des = -1; } }
  if (STREET && !EMB) { const q = new URLSearchParams(location.search), c1 = hex(q.get("c1")), c2 = hex(q.get("c2"));   // Street: tu equipo con tu ropa contra la banda del barrio
    TEAMS[0].name = "TU EQUIPO"; TEAMS[0].short = "TÚ"; if (c1) TEAMS[0].kit = [c1, c2 || "#111111"]; TEAMS[1].name = "LOS DEL PUERTO"; TEAMS[1].short = "PTO"; { const c = new THREE.Color(TEAMS[0].kit[0]), red = c.r > c.b + .15 && c.r > c.g; TEAMS[1].kit = red || lum(TEAMS[0].kit[0]) > .6 ? ["#1e6bff", "#f4f7ff"] : ["#d3202c", "#f4f7ff"]; }
    // reto del barrio (Rey de la pista): nombre, ropa y nivel de la banda rival
    const rn = (q.get("rn") || "").slice(0, 22), r1 = hex(q.get("r1")), r2 = hex(q.get("r2")); if (rn) { TEAMS[1].name = rn.toUpperCase(); TEAMS[1].short = (q.get("rs") || rn).slice(0, 3).toUpperCase(); } if (r1) TEAMS[1].kit = [r1, r2 || "#111111"];
    window.ST_RD = clamp(+(q.get("rd") || 0), -12, 14); }
  { const hs = n => [...String(n)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7); TEAMS.forEach(T => { if (window.KITDES != null) T.des = window.KITDES; else if (T.des == null) T.des = hs(T.name) % 9; }); }
  setLoad("jugadores");
  const P = [], NP = STREET ? 4 : 11;
  for (let t = 0; t < 2; t++) {
    const src = EMB ? EMB.teams[t].pl.slice(0, NP) : null, roles = src ? src.map(d => d.role || "MC") : (STREET ? ["POR", "DFC", "EI", "ED"] : F433.map(f => f[0]));
    // anchura: los que comparten profundidad se reparten a lo ancho (en el orden de la alineación)
    const groups = {}; roles.forEach((r, i) => { const R = ROLE[r] || ROLE.MC; (groups[R[0]] = groups[R[0]] || []).push(i); });
    const widths = {}; Object.values(groups).forEach(ix => { const c = ix.filter(i => SIDE_W[roles[i]] == null); c.forEach((i, j) => widths[i] = c.length === 1 ? .5 : .3 + .4 * j / (c.length - 1)); ix.forEach(i => { if (SIDE_W[roles[i]] != null) widths[i] = SIDE_W[roles[i]]; }); });
    for (let i = 0; i < NP; i++) {
      const role = roles[i], R = ROLE[role] || ROLE.MC, gkk = i === 0 || role === "POR", d = src ? src[i] : null;
      const numb = d && d.num ? d.num : [1, 3, 4, 5, 2, 8, 6, 10, 11, 9, 7][i]; setLoad("jugadores " + (t * NP + i + 1) + "/" + 2 * NP);
      const a = await makeActor(gkk ? TEAMS[t].gkModel : PJM[(i - 1 + t * 10 + (EMB ? 0 : 0)) % PJM.length], gkk ? (t ? ["#f59e0b", "#1f2937"] : ["#16a34a", "#111827"]) : TEAMS[t].kit, numb, gkk ? 9 : TEAMS[t].des);
      const r = () => 68 + Math.floor(Math.random() * 20), S0 = d && d.st ? d.st : null, sv = (k, def) => S0 && S0[k] != null ? +S0[k] : def;
      const st = { pac: sv("pac", r()), acc: sv("pac", r()), agi: sv("dri", r()), dri: sv("dri", r()), sho: sv("sho", r()), pas: sv("pas", r()), def: sv("def", r()), phy: sv("phy", r()), gk: gkk ? (d && d.ov ? +d.ov : 82) : 40 };
      if (!S0) { if (R[1] === "fwd") { st.sho += 8; st.pac += 5; st.def -= 15; } if (R[1] === "def") { st.def += 8; st.sho -= 15; } }
      if (t === 1 && window.ST_RD) for (const kk in st) st[kk] = clamp(st[kk] + window.ST_RD, 30, 99);
      if (EMB && EMB.cpu && EMB.cpu.includes(t)) { const k = { "Fácil": -8, "Normal": 0, "Difícil": 5, "Leyenda": 9 }[EMB.diff] || 0; for (const kk in st) st[kk] = clamp(st[kk] + k, 30, 99); }
      Object.assign(a, { model: gkk ? TEAMS[t].gkModel : PJM[(i - 1 + t * 10) % PJM.length], t, i, role, cat: gkk ? "gk" : R[1], fb: !!R[2], base: { d: R[0], w: widths[i] != null ? widths[i] : .5 }, gk: gkk, name: d ? d.n : NAMES[t][i], u: d ? d.u : null, num: [1, 3, 4, 5, 2, 8, 6, 10, 11, 9, 7][i],
        st, ai: { t: Math.random() * .5, run: null, tgt: null }, dr: { plan: null, lastT: -9, loose: 0, lastFoot: "R" }, down: 0 });
      P.push(a);
    }
  }
  // árbitro, jueces de línea y entrenadores (modelos de Meshy con las mismas animaciones)
  const OFF = []; setLoad("árbitros y banquillos");
  if (!STREET) for (const [m, role, kit, x, y] of [["arbitro", "ref", ["#111111", "#111111"], L / 2 - 8, W / 2 + 6], ["juez", "ln0", ["#111111", "#111111"], L * .3, -1.2], ["juez", "ln1", ["#111111", "#111111"], L * .7, W + 1.2], ["entrenador1", "co0", null, L / 2 - 7, -2.4], ["entrenador2", "co1", null, L / 2 + 7, -2.4]]) {
    try { const a = await makeActor(m, kit, null); Object.assign(a, { role, x, y, h: Math.PI / 2, mh: Math.PI / 2, st: { agi: 75, acc: 72, pac: 70 }, ai: {}, dr: {}, down: 0, t: -1 }); OFF.push(a); } catch (e) { console.warn(m, e); } }
  function offStep(a, dt) {
    let tx = a.x, ty = a.y, face = null;
    if (a.role === "ref" && a.goto && simT < a.goto.until) { tx = a.goto.x; ty = a.goto.y; face = Math.atan2(ball.y - a.y, ball.x - a.x); }
    else if (a.role === "ref") { // diagonal: unos 14 m del balón, por el lado izquierdo del juego, sin estorbar
      const off = M.owner ? M.dirOf[M.owner.t] : 1; tx = clamp(ball.x - off * 9, 8, L - 8); ty = clamp(ball.y + (ball.y < W / 2 ? 10 : -10), 6, W - 6); face = Math.atan2(ball.y - a.y, ball.x - a.x); }
    else if (a.role === "ln0" || a.role === "ln1") { const side = a.role === "ln0" ? 0 : 1, half = side ? [L / 2, L] : [0, L / 2];
      // cada juez sigue al penúltimo defensor (o al balón si está más adelantado) en su mitad
      const t = (M.dirOf[0] > 0) === !!side ? 1 : 0, defs = team(t).map(q => q.x).sort((u, v) => side ? v - u : u - v); let lx = defs[1] != null ? defs[1] : L / 2; lx = side ? Math.max(lx, ball.x) : Math.min(lx, ball.x);
      tx = clamp(lx, half[0] + 2, half[1] - 1); ty = side ? W + 1.2 : -1.2; face = side ? -Math.PI / 2 : Math.PI / 2; }
    else { face = Math.atan2(ball.y - a.y, ball.x - a.x); if (!a.one && Math.random() < dt * .04) startOne(a, Math.random() < .5 ? "Pointing" : "Clapping", { ts: 1, rootScale: 0, h0: a.h, fadeIn: .3, fadeOut: .4 }); }
    const d = Math.hypot(tx - a.x, ty - a.y), C = d > .6 ? { dir: Math.atan2(ty - a.y, tx - a.x), m: 1, speed: clamp(d * .9, 1.2, 6.2), face: d < 12 ? face : null } : { dir: null, m: 0, face };
    if (C.dir == null && face != null) a.h += clamp(angD(a.h, face), -3 * dt, 3 * dt), a.mh = a.h;
    moveP(a, dt, C); stepOne(a, dt);
  }
  /* ---------- público: los aficionados de Meshy se fotografían en varias poses (impostores) y se reparten por las gradas ---------- */
  setLoad("público");
  const CROWD = await (async () => { try {
    if (!STANDS.length && !window.EST2_SEATS) return null; S.updateMatrixWorld(true);
    // 1) asientos: puntos del módulo de grada (calculados una vez con rayos verticales), se repiten en todos los módulos
    const seats = [[-0.9015,0.2627,-0.6515],[-0.9015,0.2638,-0.5306],[-0.9015,0.264,-0.4098],[-0.9015,0.1623,-0.3493],[-0.9015,0.0991,-0.2284],[-0.9015,0.0466,-0.168],[-0.9015,-0.0041,-0.1075],[-0.9015,-0.0672,0.0133],[-0.9015,-0.1149,0.0738],[-0.9015,-0.1654,0.1342],[-0.9015,-0.2276,0.2551],[-0.9015,-0.2795,0.3156],[-0.9015,-0.3397,0.376],[-0.9015,-0.4082,0.4969],[-0.9015,-0.4724,0.5573],[-0.8123,0.2633,-0.5911],[-0.8123,0.2648,-0.4702],[-0.8123,0.2641,-0.3493],[-0.8123,0.1614,-0.2889],[-0.8123,0.1,-0.2284],[-0.8123,0.0897,-0.1075],[-0.8123,-0.0056,-0.0471],[-0.8123,-0.0672,0.0133],[-0.8123,-0.1659,0.1947],[-0.8123,-0.2268,0.2551],[-0.8123,-0.2773,0.4364],[-0.8123,-0.4083,0.4969],[-0.8123,-0.4186,0.6178],[-0.723,0.2634,-0.5911],[-0.723,0.265,-0.4702],[-0.723,0.2623,-0.3493],[-0.723,0.1616,-0.2889],[-0.723,0.0999,-0.2284],[-0.723,0.0894,-0.1075],[-0.723,-0.0056,-0.0471],[-0.723,-0.0669,0.0133],[-0.723,-0.1655,0.1947],[-0.723,-0.2268,0.2551],[-0.723,-0.2833,0.376],[-0.723,-0.4082,0.4969],[-0.723,-0.4722,0.5573],[-0.6338,0.2633,-0.5911],[-0.6338,0.2646,-0.4702],[-0.6338,0.2651,-0.3493],[-0.6338,0.1616,-0.2889],[-0.6338,0.0909,-0.1075],[-0.6338,-0.006,-0.0471],[-0.6338,-0.0669,0.0133],[-0.6338,-0.0699,0.1342],[-0.6338,-0.1653,0.1947],[-0.6338,-0.2265,0.2551],[-0.6338,-0.2774,0.3156],[-0.6338,-0.2804,0.4364],[-0.6338,-0.408,0.4969],[-0.6338,-0.4192,0.6178],[-0.5446,0.2631,-0.5911],[-0.5446,0.2639,-0.4702],[-0.5446,0.264,-0.3493],[-0.5446,0.1616,-0.2889],[-0.5446,-0.0057,-0.0471],[-0.5446,-0.0666,0.0133],[-0.5446,-0.0699,0.1342],[-0.5446,-0.1654,0.1947],[-0.5446,-0.2266,0.2551],[-0.5446,-0.2749,0.4364],[-0.5446,-0.4079,0.4969],[-0.5446,-0.418,0.6178],[-0.4554,0.2631,-0.5911],[-0.4554,0.2645,-0.4702],[-0.4554,0.1634,-0.3493],[-0.4554,0.0453,-0.168],[-0.4554,-0.0045,-0.1075],[-0.4554,-0.0668,0.0133],[-0.4554,-0.1146,0.0738],[-0.4554,-0.165,0.1342],[-0.4554,-0.2267,0.2551],[-0.4554,-0.2789,0.3156],[-0.4554,-0.3397,0.376],[-0.4554,-0.4079,0.4969],[-0.4554,-0.4182,0.6178],[-0.3661,0.2631,-0.5911],[-0.3661,0.2648,-0.4702],[-0.3661,0.2622,-0.3493],[-0.3661,0.1616,-0.2889],[-0.3661,0.0906,-0.1075],[-0.3661,-0.0053,-0.0471],[-0.3661,-0.0669,0.0133],[-0.3661,-0.1138,0.0738],[-0.3661,-0.165,0.1342],[-0.3661,-0.2269,0.2551],[-0.3661,-0.278,0.3156],[-0.3661,-0.3396,0.376],[-0.3661,-0.4079,0.4969],[-0.3661,-0.4719,0.5573],[-0.2769,0.2631,-0.5911],[-0.2769,0.2647,-0.4702],[-0.2769,0.2645,-0.3493],[-0.2769,0.1617,-0.2889],[-0.2769,0.0921,-0.1075],[-0.2769,-0.0056,-0.0471],[-0.2769,-0.0671,0.0133],[-0.2769,-0.0688,0.1342],[-0.2769,-0.1655,0.1947],[-0.2769,-0.2269,0.2551],[-0.2769,-0.2318,0.376],[-0.2769,-0.3401,0.4364],[-0.2769,-0.4078,0.4969],[-0.2769,-0.4176,0.6178],[-0.1877,0.2631,-0.5911],[-0.1877,0.2643,-0.4702],[-0.1877,0.2636,-0.3493],[-0.1877,0.1619,-0.2889],[-0.1877,0.1006,-0.2284],[-0.1877,-0.0053,-0.0471],[-0.1877,-0.0672,0.0133],[-0.1877,-0.0687,0.1342],[-0.1877,-0.1655,0.1947],[-0.1877,-0.2268,0.2551],[-0.1877,-0.231,0.376],[-0.1877,-0.3401,0.4364],[-0.1877,-0.4078,0.4969],[-0.1877,-0.4175,0.6178],[-0.0985,0.2631,-0.5911],[-0.0985,0.264,-0.4702],[-0.0985,0.2645,-0.3493],[-0.0985,0.1622,-0.2889],[-0.0985,0.0997,-0.2284],[-0.0985,0.0906,-0.1075],[-0.0985,-0.0052,-0.0471],[-0.0985,-0.0672,0.0133],[-0.0985,-0.0697,0.1342],[-0.0985,-0.1655,0.1947],[-0.0985,-0.2266,0.2551],[-0.0985,-0.2313,0.376],[-0.0985,-0.3401,0.4364],[-0.0985,-0.4078,0.4969],[-0.0985,-0.3862,0.5573],[-0.0985,-0.473,0.6178],[-0.0092,0.2631,-0.5911],[-0.0092,0.264,-0.4702],[-0.0092,0.2645,-0.3493],[-0.0092,0.1621,-0.2889],[-0.0092,0.1005,-0.2284],[-0.0092,0.0903,-0.1075],[-0.0092,-0.0051,-0.0471],[-0.0092,-0.0672,0.0133],[-0.0092,-0.1143,0.0738],[-0.0092,-0.1655,0.1947],[-0.0092,-0.2268,0.2551],[-0.0092,-0.2283,0.376],[-0.0092,-0.3401,0.4364],[-0.0092,-0.4078,0.4969],[-0.0092,-0.4178,0.6178],[0.08,0.2626,-0.6515],[0.08,0.2635,-0.5306],[0.08,0.1633,-0.3493],[0.08,0.0999,-0.2284],[0.08,0.0894,-0.1075],[0.08,-0.0051,-0.0471],[0.08,-0.0671,0.0133],[0.08,-0.0715,0.1342],[0.08,-0.1655,0.1947],[0.08,-0.2269,0.2551],[0.08,-0.2299,0.376],[0.08,-0.3401,0.4364],[0.08,-0.4077,0.4969],[0.08,-0.4187,0.6178],[0.1692,0.2626,-0.6515],[0.1692,0.2635,-0.5306],[0.1692,0.264,-0.3493],[0.1692,0.1616,-0.2889],[0.1692,0.1005,-0.2284],[0.1692,0.0889,-0.1075],[0.1692,-0.0051,-0.0471],[0.1692,-0.067,0.0133],[0.1692,-0.0708,0.1342],[0.1692,-0.1655,0.1947],[0.1692,-0.2268,0.2551],[0.1692,-0.2298,0.376],[0.1692,-0.3401,0.4364],[0.1692,-0.4077,0.4969],[0.2584,0.263,-0.5911],[0.2584,0.2646,-0.4702],[0.2584,0.2643,-0.3493],[0.2584,0.1616,-0.2889],[0.2584,0.1001,-0.2284],[0.2584,0.0899,-0.1075],[0.2584,-0.005,-0.0471],[0.2584,-0.067,0.0133],[0.2584,-0.0691,0.1342],[0.2584,-0.1655,0.1947],[0.2584,-0.2267,0.2551],[0.2584,-0.2786,0.3156],[0.2584,-0.3391,0.376],[0.2584,-0.4077,0.4969],[0.2584,-0.4192,0.6178],[0.3477,0.2644,-0.4702],[0.3477,0.2624,-0.3493],[0.3477,0.1616,-0.2889],[0.3477,0.1001,-0.2284],[0.3477,-0.0045,-0.1075],[0.3477,-0.067,0.0133],[0.3477,-0.1141,0.0738],[0.3477,-0.1655,0.1947],[0.3477,-0.2267,0.2551],[0.3477,-0.2306,0.376],[0.3477,-0.3404,0.4364],[0.3477,-0.4077,0.4969],[0.3477,-0.4185,0.6178],[0.4369,0.2639,-0.5306],[0.4369,0.2646,-0.4098],[0.4369,0.1617,-0.2889],[0.4369,0.1001,-0.2284],[0.4369,0.0476,-0.168],[0.4369,-0.0046,-0.1075],[0.4369,-0.0669,0.0133],[0.4369,-0.1655,0.1947],[0.4369,-0.2268,0.2551],[0.4369,-0.231,0.376],[0.4369,-0.3404,0.4364],[0.4369,-0.4077,0.4969],[0.4369,-0.4182,0.6178],[0.5261,0.2637,-0.5306],[0.5261,0.1634,-0.3493],[0.5261,0.0999,-0.2284],[0.5261,0.0886,-0.1075],[0.5261,-0.0059,-0.0471],[0.5261,-0.0669,0.0133],[0.5261,-0.0704,0.1342],[0.5261,-0.1654,0.1947],[0.5261,-0.2268,0.2551],[0.5261,-0.2313,0.376],[0.5261,-0.3408,0.4364],[0.5261,-0.408,0.4969],[0.5261,-0.4181,0.6178],[0.6153,0.2637,-0.5306],[0.6153,0.2647,-0.3493],[0.6153,0.1618,-0.2889],[0.6153,0.1001,-0.2284],[0.6153,0.0899,-0.1075],[0.6153,-0.0056,-0.0471],[0.6153,-0.0665,0.0133],[0.6153,-0.0679,0.1342],[0.6153,-0.1655,0.1947],[0.6153,-0.2266,0.2551],[0.6153,-0.2766,0.3156],[0.6153,-0.3397,0.376],[0.6153,-0.4081,0.4969],[0.6153,-0.412,0.6178],[0.7046,0.2634,-0.5911],[0.7046,0.2645,-0.4702],[0.7046,0.264,-0.3493],[0.7046,0.1619,-0.2889],[0.7046,0.1005,-0.2284],[0.7046,0.0897,-0.1075],[0.7046,-0.0053,-0.0471],[0.7046,-0.0664,0.0133],[0.7046,-0.1161,0.0738],[0.7046,-0.1644,0.1342],[0.7046,-0.2258,0.2551],[0.7046,-0.2775,0.3156],[0.7046,-0.3399,0.376],[0.7046,-0.4078,0.4969],[0.7046,-0.4172,0.6178],[0.7938,0.2635,-0.5911],[0.7938,0.2638,-0.4702],[0.7938,0.1633,-0.3493],[0.7938,0.0995,-0.2284],[0.7938,0.0906,-0.1075],[0.7938,-0.0051,-0.0471],[0.7938,-0.0671,0.0133],[0.7938,-0.0707,0.1342],[0.7938,-0.1654,0.1947],[0.7938,-0.227,0.2551],[0.7938,-0.2313,0.376],[0.7938,-0.3416,0.4364],[0.7938,-0.4077,0.4969],[0.7938,-0.4183,0.6178],[0.883,0.2638,-0.4098],[0.883,0.1632,-0.3493],[0.883,0.0985,-0.2284],[0.883,0.0469,-0.168],[0.883,-0.0044,-0.1075],[0.883,-0.0671,0.0133],[0.883,-0.1152,0.0738],[0.883,-0.1647,0.1342],[0.883,-0.2272,0.2551],[0.883,-0.2788,0.3156],[0.883,-0.34,0.376],[0.883,-0.4077,0.4969],[0.883,-0.4718,0.5573]].map(v => new THREE.Vector3(v[0], v[1], v[2]));
    // 2) fotos de los aficionados en varias poses
    const FR = [["Cheering", .1], ["Cheering", .35], ["Cheering", .6], ["Cheering", .85], ["Clapping", .2], ["Clapping", .7], ["StandardIdle", .3]], NM = [], CW = 128, CH = 256; for (const kt of [TEAMS[0].kit, TEAMS[1].kit, ["#d9dce1", "#3b4350"], ["#2b2f36", "#1b1f26"]]) for (const mn of ["aficionado1", "aficionado2", "aficionado3"]) NM.push([mn, kt]);
    const rt = new THREE.WebGLRenderTarget(CW * FR.length, CH * NM.length, { samples: 0 }); rt.texture.generateMipmaps = true; rt.texture.minFilter = THREE.LinearMipmapLinearFilter;
    const isc = new THREE.Scene(); isc.environment = S.environment; isc.add(new THREE.HemisphereLight(0xffffff, 0x445533, 1.2)); const dl = new THREE.DirectionalLight(0xffffff, 2); dl.position.set(1, 3, 4); isc.add(dl);
    const oc = new THREE.OrthographicCamera(-.58, .58, 2.08, -.24, .1, 20); oc.position.set(0, 1, 6); oc.lookAt(0, 1, 0);
    Rn.setRenderTarget(rt); Rn.setClearColor(0x000000, 0); Rn.clear(); const tm = Rn.toneMapping;
    for (let r = 0; r < NM.length; r++) { const a = await makeActor(NM[r][0], NM[r][1], null); a.wrap.removeFromParent(); isc.add(a.wrap); a.x = L / 2; a.y = W / 2; a.h = a.mh = Math.PI / 2; a.wrap.position.set(0, 0, 0); a.wrap.rotation.set(0, 0, 0);
      for (let f = 0; f < FR.length; f++) { const [n, ph] = FR[f]; a.one = null; a.oneW = 1; startOne(a, n, { t0: META[n].dur * ph, ts: 0, rootScale: 0, h0: a.h }); pose(a, 0, FWD); a.wrap.position.set(0, 0, 0); a.wrap.rotation.set(0, 0, 0);
        rt.viewport.set(f * CW, (NM.length - 1 - r) * CH, CW, CH); rt.scissor.copy(rt.viewport); rt.scissorTest = true; Rn.setRenderTarget(rt); Rn.render(isc, oc); }
      isc.remove(a.wrap); }
    rt.scissorTest = false; Rn.setRenderTarget(null); Rn.setClearColor(0x000000, 1);
    // 3) un plano por aficionado (instanciado) mirando al campo; el sombreador elige pose y botes según la emoción del partido
    const n = window.EST2_SEATS ? window.EST2_SEATS.length : seats.length * STANDS.length, geo = new THREE.PlaneGeometry(1.16, 2.32); geo.translate(0, .92, 0);
    const aF = new Float32Array(n * 3); const mat = new THREE.MeshBasicMaterial({ map: rt.texture, alphaTest: .45, side: THREE.DoubleSide });
    const U = { uT: { value: 0 }, uEx: { value: 0 }, uExT: { value: new THREE.Vector2() }, uG: { value: new THREE.Vector2(FR.length, NM.length) } };
    mat.onBeforeCompile = sh => { Object.assign(sh.uniforms, U);
      sh.vertexShader = "uniform float uT; uniform float uEx; uniform vec2 uExT; uniform vec2 uG; attribute vec3 aF;\nfloat exOf(){ return aF.x < 2.5 ? uExT.x : aF.x < 5.5 ? uExT.y : uEx; }\n" + sh.vertexShader.replace("#include <uv_vertex>", `#include <uv_vertex>
        { float ex = clamp(exOf() + step(.9, fract(aF.y * 3.7)) * .25, 0., 1.), fr; float wave = fract(uT * (1.3 + aF.y) + aF.y * 9.);
          if (ex > fract(aF.y * 5.3) * .95) fr = floor(fract(uT * 1.7 + aF.y) * 4.); else if (fract(aF.y * 7.3) > .82) fr = 4. + step(.5, fract(uT * 3.5 + aF.y)); else fr = 6.;
          vMapUv = vec2((fr + uv.x) / uG.x, (uG.y - 1. - aF.x + uv.y) / uG.y); }`).replace("#include <begin_vertex>", `#include <begin_vertex>
        transformed.y += max(0., exOf() - fract(aF.y * 5.3) * .5) * abs(sin(uT * 7. + aF.y * 40.)) * .32;`); };
    const im = new THREE.InstancedMesh(geo, mat, n); im.frustumCulled = false; const mm = new THREE.Matrix4(), q = new THREE.Vector3(), cc = new THREE.Color(); let k = 0;
    const SRC = window.EST2_SEATS ? [{ matrixWorld: new THREE.Matrix4(), pts: window.EST2_SEATS }] : STANDS.map(md => ({ matrixWorld: md.matrixWorld, pts: seats.map(a => new THREE.Vector3(...a)) }));
    for (const md of SRC) { const rel = md.matrixWorld; for (const sp of md.pts) { if (Math.random() < .1) continue; q.copy(sp).applyMatrix4(rel);
        const yaw = Math.atan2(-(q.x), -(q.z)) ; mm.makeRotationY(yaw); mm.setPosition(q.x + (Math.random() - .5) * .1, q.y, q.z); im.setMatrixAt(k, mm);
        cc.setScalar(.8 + Math.random() * .25); im.setColorAt(k, cc); { const r = Math.random(); aF[k * 3] = Math.floor(Math.random() * 3) + (r < .5 ? 0 : r < .7 ? 3 : r < .86 ? 6 : 9); } aF[k * 3 + 1] = Math.random(); k++; } }
    im.count = QUAL === "baja" ? Math.floor(k * .5) : k; geo.setAttribute("aF", new THREE.InstancedBufferAttribute(aF, 3)); S.add(im);
    return { im, U, n: k };
  } catch (e) { console.warn("público", e); return null; } })();
  const team = t => P.filter(p => p.t === t && !p.sent), GKP = t => P.find(q => q.t === t && q.gk), mid = t => team(t).find(q => q.cat === "mid") || team(t)[Math.min(5, team(t).length - 1)];

  /* ---------- estado del partido ---------- */
  const M = { half: 1, clock: 0, halfLen: EMB && EMB.halfLen ? EMB.halfLen : STREET ? 150 : 240, dirOf: [1, -1], phase: "set", set: null, last: null, owner: null, pass: null, human: null, humanTeam: EMB ? (EMB.human == null ? -1 : EMB.human) : 0, goals: [], msgT: 0, endT: 0 };
  const own = t => M.dirOf[t] > 0 ? 0 : L, opp = t => M.dirOf[t] > 0 ? L : 0;
  const prog = (t, x) => M.dirOf[t] > 0 ? x / L : 1 - x / L;           // 0 portería propia → 1 rival
  const fx = (t, d) => M.dirOf[t] > 0 ? d * L : L - d * L;              // de profundidad a x
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  /* ---------- horario y clima: Noche / Día y lluvia / nieve (con lluvia el balón corre más, con nieve se frena) ---------- */
  const QS = new URLSearchParams(location.search), TODR = EMB ? EMB.tod || "Auto" : QS.get("tod") || "Día", WXR = EMB ? (EMB.weather === undefined ? null : EMB.weather || "none") : QS.get("clima") || "none";
  const NIGHT = /noche/i.test(TODR) || (/auto/i.test(TODR) && Math.random() < .35), WX = /lluvia/i.test(WXR || "") ? "lluvia" : /nieve/i.test(WXR || "") ? "nieve" : (!WXR && Math.random() < .1 ? (Math.random() < .7 ? "lluvia" : "nieve") : null);
  let FRA = WX === "lluvia" ? .56 : WX === "nieve" ? 1.1 : .7, FRB = WX === "lluvia" ? .22 : WX === "nieve" ? .38 : .27;   // balón vivo, como en DLS if (window.PLAYA) { FRA = 1.35; FRB = .45; }   // arena: el balón rueda mucho menos
  /* ---------- balón ---------- */
  const ball = { x: L / 2, y: W / 2, z: 0, vx: 0, vy: 0, vz: 0, wx: 0, wy: 0, wz: 0, inNet: false, hold: null };
  let simT = 0; const TIMERS = []; const later = (sec, fn) => TIMERS.push({ at: simT + sec, fn });
  function ballStep(b, dt) {
    if (b.hold) return;
    const stepL = Math.hypot(b.vx, b.vy, b.vz) * dt; if (!b._sub && stepL > .15 && (b.x < GD + 5 || b.x > L - GD - 5)) { const n = Math.min(12, Math.ceil(stepL / .15)); b._sub = 1; for (let i = 0; i < n; i++) ballStep(b, dt / n); b._sub = 0; return; }
    const py0 = b.y, pz0 = b.z;
    const sp = Math.hypot(b.vx, b.vy, b.vz);
    if (b.z > .001 || b.vz > 0) {
      const kd = .0125 * sp; b.vx -= kd * b.vx * dt; b.vy -= kd * b.vy * dt; b.vz -= (kd * b.vz + G) * dt;
      const km = .0042; b.vx += km * (b.wy * b.vz - b.wz * b.vy) * dt; b.vy += km * (b.wz * b.vx - b.wx * b.vz) * dt; b.vz += km * (b.wx * b.vy - b.wy * b.vx) * dt;
      b.z += b.vz * dt;
      if (b.z <= 0) { b.z = 0; if (b.vz < -1.2) { if (b === ball && b.vz < -2.5) play("bote", clamp(-b.vz / 14, .08, .6), .9 + Math.random() * .2); b.vz = -b.vz * .55; b.vx *= .82; b.vy *= .82; b.wx *= .5; b.wy *= .5; b.wz *= .6; } else b.vz = 0; }
    } else { const h = Math.hypot(b.vx, b.vy); if (h > 0) { const ns = Math.max(0, h - (FRA + FRB * h) * dt); b.vx *= ns / h; b.vy *= ns / h; } b.wz *= Math.pow(.2, dt); b.wx = b.wy = 0; }
    const px = b.x; b.x += b.vx * dt; b.y += b.vy * dt;
    for (const side of [0, 1]) { const gx = side ? L : 0, dir = side ? 1 : -1, inside = (b.x - gx) * dir;
      for (const py of [W / 2 - GW / 2, W / 2 + GW / 2]) { const dx = b.x - gx, dy = b.y - py, d = Math.hypot(dx, dy); if (d < BR + .06 && b.z < GH) { const nx = dx / d, ny = dy / d, vn = b.vx * nx + b.vy * ny; if (vn < 0) { b.vx -= 1.7 * vn * nx; b.vy -= 1.7 * vn * ny; b.x = gx + nx * (BR + .061); b.y = py + ny * (BR + .061); hit("¡AL PALO!"); } } }
      if (Math.abs(inside) < BR + .06 && Math.abs(b.z - GH) < BR + .06 && Math.abs(b.y - W / 2) < GW / 2) { const dz = b.z - GH, dx = b.x - gx, d = Math.hypot(dx, dz) || 1; const nx = dx / d, nz = dz / d, vn = b.vx * nx + b.vz * nz; if (vn < 0) { b.vx -= 1.7 * vn * nx; b.vz -= 1.7 * vn * nz; hit("¡LARGUERO!"); } }
      const pin = (px - gx) * dir, inMouth = y => Math.abs(y - W / 2) < GW / 2;
      if (inside > 0 && inside < GD + .5 && inMouth(b.y) && b.z < GH && pin <= .05 + BR) { if (!b.inNet && M.phase === "play" && !(b.hold)) { b.inNet = true; goalScored(side); } }
      if (inside > -BR && inside < GD + BR && b.z < GH + BR) {   // red: fondo, laterales y techo (desde dentro y desde fuera)
        const netHit = (part, hx, hy, hz, f) => { const n = nets.find(q => q.side === side && q.part === part); if (n) { n.hit = Math.min(1.3, .5 + f * .07); n.hx = hx; n.hy = hy; n.hz = hz; } };
        const spd = Math.hypot(b.vx, b.vy, b.vz);
        if (inMouth(b.y) && b.z < GH && ((pin < GD - .2 && inside >= GD - .2) || (pin > GD + .1 && inside <= GD + .1))) { const inn = pin < GD; b.x = gx + dir * (inn ? GD - .2 : GD + .1 + BR); b.vx *= -.12; b.vy *= .45; b.vz *= .35; netHit("back", b.x, b.y, b.z, spd); }
        for (const [yy, sgn] of [[W / 2 - GW / 2, -1], [W / 2 + GW / 2, 1]]) { const was = (py0 - yy) * sgn, now = (b.y - yy) * sgn;
          if (inside > 0 && inside < GD && b.z < GH && ((was < -.0 && now >= -BR * .5) || (was > 0 && now <= BR * .5)) && !(Math.abs(b.x - gx) < .15)) { const out = was > 0; b.y = yy + sgn * (out ? BR + .02 : -BR - .02); b.vy *= -.15; b.vx *= .5; b.vz *= .5; netHit(sgn < 0 ? "s0" : "s1", b.x, b.y, b.z, spd); } }
        if (inside > 0 && inside < GD && inMouth(b.y) && ((pz0 < GH && b.z >= GH - BR * .5) || (pz0 > GH && b.z <= GH + BR))) { const up = pz0 > GH; b.z = up ? GH + BR : GH - BR - .02; b.vz = up ? Math.abs(b.vz) * .2 : -Math.abs(b.vz) * .15; b.vx *= .6; b.vy *= .6; netHit("top", b.x, b.y, b.z, spd); }
      }
    }
    if (STREET) { const mouth = Math.abs(b.y - W / 2) < GW / 2 - BR && b.z < GH, sp0 = Math.hypot(b.vx, b.vy), bump = () => { if (b === ball && sp0 > 5 && !window.STEP) play("bote", clamp(sp0 / 25, .1, .5), .7); };   // paredes: el balón rebota y sigue en juego
      if (b.y < BR) { b.y = BR; if (b.vy < 0) { b.vy = -b.vy * .62; b.vx *= .9; bump(); } } else if (b.y > W - BR) { b.y = W - BR; if (b.vy > 0) { b.vy = -b.vy * .62; b.vx *= .9; bump(); } }
      if (!mouth && !b.inNet) { if (b.x < BR && b.x > -2) { b.x = BR; if (b.vx < 0) { b.vx = -b.vx * .62; b.vy *= .9; bump(); } } else if (b.x > L - BR && b.x < L + 2) { b.x = L - BR; if (b.vx > 0) { b.vx = -b.vx * .62; b.vy *= .9; bump(); } } } }
    if (b.x < -6 || b.x > L + 6) { b.vx *= -.3; b.x = clamp(b.x, -6, L + 6); } if (b.y < -6 || b.y > W + 6) { b.vy *= -.3; b.y = clamp(b.y, -6, W + 6); }
  }
  function predictBall(t, src = ball) { const b = Object.assign({}, src), h = 1 / 30; for (let k = 0; k < t; k += h) { const sp = Math.hypot(b.vx, b.vy, b.vz); if (b.z > .001 || b.vz > 0) { const kd = .0125 * sp; b.vx -= kd * b.vx * h; b.vy -= kd * b.vy * h; b.vz -= (kd * b.vz + G) * h; b.z += b.vz * h; if (b.z <= 0) { b.z = 0; b.vz = b.vz < -1.2 ? -b.vz * .55 : 0; } } else { const hh = Math.hypot(b.vx, b.vy); if (hh > 0) { const ns = Math.max(0, hh - (FRA + FRB * hh) * h); b.vx *= ns / hh; b.vy *= ns / hh; } } b.x += b.vx * h; b.y += b.vy * h; } return b; }
  const rollV0 = (D, T) => Math.max(0, (D + FRA / FRB * T) * FRB / (1 - Math.exp(-FRB * T)) - FRA / FRB);
  const rollDist = (v0, T) => (v0 + FRA / FRB) * (1 - Math.exp(-FRB * T)) / FRB - FRA / FRB * T;
  function rollTime(v0, D) { let t = 0; const h = .05; let v = v0, s = 0; while (s < D && t < 6) { v = Math.max(0, v - (FRA + FRB * v) * h); s += v * h; t += h; if (v <= 0) return 99; } return t; }

  /* ---------- sonido y mensajes ---------- */
  let AC = null; const sfx = (f, d, g, type = "sine") => { try { AC = AC || new AudioContext(); const t = AC.currentTime, o = AC.createOscillator(), gn = AC.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(Math.max(30, f * .35), t + d); gn.gain.setValueAtTime(g, t); gn.gain.exponentialRampToValueAtTime(.001, t + d); o.connect(gn); gn.connect(AC.destination); o.start(t); o.stop(t + d + .02); } catch (e) {} };
  // ambiente del estadio: murmullo continuo (ruido filtrado) que sube con las ocasiones y estalla con los goles
  let CS = null; function crowdSound() { if (!AC || window.STEP || window.DR) return; try {
      if (CS && !CS.real && SND.ambiente) { try { CS.src.stop(); } catch (e) {} CS = null; }
      if (!CS && SND.ambiente) { const src = AC.createBufferSource(); src.buffer = SND.ambiente; src.loop = true; const bp = AC.createBiquadFilter(); bp.type = "lowshelf"; bp.frequency.value = 300; const g = AC.createGain(); g.gain.value = 0; src.connect(bp); bp.connect(g); g.connect(AC.destination); src.start(0, Math.random() * 25); CS = { g, bp, src, real: 1 }; }
      if (!CS) { const len = AC.sampleRate * 4, buf = AC.createBuffer(2, len, AC.sampleRate); for (let c = 0; c < 2; c++) { const d = buf.getChannelData(c); let b = 0; for (let i = 0; i < len; i++) { b = b * .985 + (Math.random() * 2 - 1) * .15; d[i] = b; } }
        const src = AC.createBufferSource(); src.buffer = buf; src.loop = true; const bp = AC.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 520; bp.Q.value = .6; const hp = AC.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 140; const g = AC.createGain(); g.gain.value = 0;
        src.connect(hp); hp.connect(bp); bp.connect(g); g.connect(AC.destination); src.start(); CS = { g, bp, src }; }
      const ex = M.crowdEx || 0, t = AC.currentTime; if (CS.real) { CS.g.gain.setTargetAtTime((STREET ? .1 : .32) + ex * (STREET ? .3 : .55), t, .3); CS.bp.gain.setTargetAtTime(ex * 6, t, .3); } else { CS.g.gain.setTargetAtTime(.22 + ex * 1.1, t, .25); CS.bp.frequency.setTargetAtTime(480 + ex * 520, t, .3); } } catch (e) {} }
  // sonidos sintetizados con más cuerpo: golpeo (golpe grave + chasquido), red, silbato de bola, aplausos y "uuuh" del público
  let NB = null; const noiseBuf = () => { if (NB) return NB; const n = AC.sampleRate, b = AC.createBuffer(1, n, AC.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; return NB = b; };
  const ACX = () => { try { AC = AC || new AudioContext(); decS(); return AC.state === "suspended" ? (AC.resume(), AC) : AC; } catch (e) { return null; } };
  // sonidos grabados (Mixkit): se decodifican al crear el audio; si faltan, se usan los sintetizados
  const SND = {}; let SNDraw = null; asset("sonidos").then(t => { SNDraw = JSON.parse(t); decS(); }).catch(() => {});
  function decS() { if (!SNDraw || !AC) return; const r = SNDraw; SNDraw = null; for (const k in r) { const bin = atob(r[k]), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); AC.decodeAudioData(u.buffer).then(x => { SND[k] = x; }).catch(() => {}); } }
  function play(n, g = 1, rate = 1, at = 0, loop = false) { if (NET && NET.host && NET.peer && !loop) NET.ev.push(["s", n, Math.round(g * 100) / 100, Math.round(rate * 100) / 100, at]); const b = SND[n]; if (!b || window.STEP || !ACX()) return null; const s = AC.createBufferSource(); s.buffer = b; s.loop = loop; s.playbackRate.value = rate; const gn = AC.createGain(); gn.gain.value = g; s.connect(gn); gn.connect(AC.destination); s.start(AC.currentTime + at); return { s, g: gn }; }
  function nz(t0, dur, g, type, f, q, out) { const a = AC, src = a.createBufferSource(); src.buffer = noiseBuf(); const fl = a.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q || 1; const gn = a.createGain();
    gn.gain.setValueAtTime(0, t0); gn.gain.linearRampToValueAtTime(g, t0 + Math.min(.01, dur * .2)); gn.gain.exponentialRampToValueAtTime(.0008, t0 + dur); src.connect(fl); fl.connect(gn); gn.connect(out || a.destination); src.start(t0, Math.random() * .5); src.stop(t0 + dur + .05); return fl; }
  function tone(t0, f1, f0, dur, g, type) { const a = AC, o = a.createOscillator(), gn = a.createGain(); o.type = type || "sine"; o.frequency.setValueAtTime(f1, t0); o.frequency.exponentialRampToValueAtTime(f0, t0 + dur); gn.gain.setValueAtTime(g, t0); gn.gain.exponentialRampToValueAtTime(.0008, t0 + dur); o.connect(gn); gn.connect(a.destination); o.start(t0); o.stop(t0 + dur + .02); }
  function kickSnd(v) { if (window.STEP || !ACX()) return; if (SND.patada) { play(v > 17 ? "patada_fuerte" : "patada", clamp(.3 + v / 30, .3, 1), .92 + Math.random() * .16); return; } const t = AC.currentTime, k = clamp(v / 30, .15, 1); tone(t, 150 + k * 40, 55, .16, .5 * k + .1); nz(t, .05 + k * .03, .35 * k + .05, "bandpass", 1800 + k * 900, 1.2); }
  const touchSfx = s => { if (window.STEP || !ACX()) return; if (SND.toque) { play("toque", clamp(.12 + s / 14, .12, .55), .9 + Math.random() * .2); return; } const t = AC.currentTime, k = clamp(s / 8, .1, .6); tone(t, 120, 70, .08, .25 * k); nz(t, .03, .1 * k, "bandpass", 1500, 1.5); };
  function netSnd() { if (window.STEP || !ACX()) return; const t = AC.currentTime; nz(t, .45, .35, "highpass", 2500, .7); nz(t + .03, .3, .25, "bandpass", 900, 1); }
  function postSnd() { if (window.STEP || !ACX()) return; const t = AC.currentTime; tone(t, 1250, 1180, .9, .25, "triangle"); tone(t, 2650, 2550, .5, .1, "sine"); nz(t, .05, .3, "bandpass", 3000, 2); }
  function whistleBlip(t, d) { const a = AC, o = a.createOscillator(), o2 = a.createOscillator(), lfo = a.createOscillator(), lg = a.createGain(), gn = a.createGain(); o.frequency.value = 2950; o2.frequency.value = 3120; lfo.frequency.value = 32; lg.gain.value = 140; lfo.connect(lg); lg.connect(o.frequency); lg.connect(o2.frequency);
    gn.gain.setValueAtTime(0, t); gn.gain.linearRampToValueAtTime(.11, t + .02); gn.gain.setValueAtTime(.11, t + d - .04); gn.gain.linearRampToValueAtTime(0, t + d); o.connect(gn); o2.connect(gn); gn.connect(a.destination); for (const x of [o, o2, lfo]) { x.start(t); x.stop(t + d + .02); } }
  const whistle = (n = 1) => { if (window.STEP || !ACX()) return; if (SND.silbato_corto) { for (let i = 0; i < n; i++) play(n > 1 && i === n - 1 ? "silbato_largo" : "silbato_corto", .55, 1, i * .5); return; } const t = AC.currentTime; for (let i = 0; i < n; i++) whistleBlip(t + i * .42, n > 1 && i === n - 1 ? .75 : .3); };
  function crowdOoh(k = 1) { if (window.STEP || !ACX()) return; if (SND.grada_grita) { play("grada_grita", clamp(.35 * k, .2, .6), .95 + Math.random() * .1); return; } const t = AC.currentTime, f = nz(t, 1.8, .5 * k, "bandpass", 380, 2.5); f.frequency.setValueAtTime(330, t); f.frequency.linearRampToValueAtTime(520, t + .5); f.frequency.linearRampToValueAtTime(300, t + 1.7); }
  function applause(dur = 2.5, k = 1) { if (window.STEP || !ACX()) return; if (SND.grada) { play("grada", clamp(.3 * k, .2, .6), .95 + Math.random() * .1); return; } const t = AC.currentTime; for (let i = 0; i < dur * 28; i++) nz(t + Math.random() * dur, .05, (.05 + Math.random() * .08) * k * (1 - i / (dur * 28) * .6), "bandpass", 1400 + Math.random() * 1600, 1.4); }
  function chant() { if (window.STEP || !ACX()) return; if (SND.grada_grita) { play("grada_grita", .45, 1.03); return; } const t = AC.currentTime; for (let r = 0; r < 3; r++) for (const o of [0, .32, .64]) { const tt = t + r * 1.4 + o; for (let i = 0; i < 18; i++) nz(tt + Math.random() * .04, .06, .05 + Math.random() * .05, "bandpass", 1300 + Math.random() * 1200, 1.3); } }
  const msg = (t, d = 1.8) => { if (NET && NET.host && NET.peer) NET.ev.push(["m", t, d]); const e = $("#msg"); e.textContent = t; e.style.opacity = 1; M.msgT = d; };
  let hitT = -9; function hit(w) { if (simT - hitT < .4) return; hitT = simT; M.crowdEx = Math.max(M.crowdEx || 0, .55); postSnd(); crowdOoh(1); msg(w, 1.2); }

  /* ---------- entrada humana ---------- */
  const K = {}; addEventListener("keydown", e => { K[e.code] = true; if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) e.preventDefault(); });
  addEventListener("keyup", e => { K[e.code] = false; });
  const prevB = {};
  /* ---------- controles táctiles (móvil/tableta): joystick a la izquierda y botones a la derecha ---------- */
  const TS = { on: false, x: 0, y: 0 };
  (function touchUI() {
    const touch = window.TOUCHUI || ("ontouchstart" in window && matchMedia("(pointer: coarse)").matches); if (!touch) return; TS.on = true;
    const ui = document.createElement("div"); ui.id = "tui"; Object.assign(ui.style, { position: "fixed", inset: 0, pointerEvents: "none", zIndex: 5, userSelect: "none", webkitUserSelect: "none" }); document.body.appendChild(ui);
    const base = document.createElement("div"), knob = document.createElement("div");
    Object.assign(base.style, { position: "absolute", left: "28px", bottom: "28px", width: "150px", height: "150px", borderRadius: "50%", background: "radial-gradient(circle,rgba(8,14,28,.25),rgba(8,14,28,.6))", border: "2px solid rgba(245,197,66,.55)", pointerEvents: "auto", touchAction: "none", boxShadow: "0 6px 18px #0007" });
    Object.assign(knob.style, { position: "absolute", left: "45px", top: "45px", width: "60px", height: "60px", borderRadius: "50%", background: "linear-gradient(180deg,#ffd86b,#f5c542)", boxShadow: "0 3px 10px #0008" }); base.appendChild(knob); ui.appendChild(base);
    let sid = null; const setK = (e) => { const r = base.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2; let dx = (e.clientX - cx) / 60, dy = (e.clientY - cy) / 60; const l = Math.hypot(dx, dy); if (l > 1) { dx /= l; dy /= l; } TS.x = dx; TS.y = dy; knob.style.transform = `translate(${dx * 45}px,${dy * 45}px)`; };
    base.addEventListener("pointerdown", e => { sid = e.pointerId; base.setPointerCapture(sid); setK(e); e.preventDefault(); });
    base.addEventListener("pointermove", e => { if (e.pointerId === sid) setK(e); });
    const end = e => { if (e.pointerId !== sid) return; sid = null; TS.x = TS.y = 0; knob.style.transform = ""; }; base.addEventListener("pointerup", end); base.addEventListener("pointercancel", end);
    const B = [["TIRO", "Space", 0, 0, 88, "#e11d48", "ENTRADA"], ["PASE", "KeyJ", 104, 6, 74, "#16a34a", "CAMBIO"], ["HUECO", "KeyI", 14, 106, 66, "#2563eb", "PRESIÓN"], ["ESPRINT", "ShiftLeft", 196, 6, 60, "#f59e0b", "ESPRINT"], ["REGATE", "KeyG", 120, 92, 56, "#0ea5e9", "CONTENER"]];
    TS.btn = [];
    for (const [lb, code, rx, by, sz, col, lbDef] of B) { const b = document.createElement("div"); b.textContent = lb; TS.btn.push([b, lb, lbDef]);
      Object.assign(b.style, { position: "absolute", right: (24 + rx) + "px", bottom: (24 + by) + "px", width: sz + "px", height: sz + "px", borderRadius: "50%", background: "rgba(8,14,28,.62)", border: "3px solid " + col, color: "#fff", font: "800 " + (sz > 70 ? 15 : 12) + "px 'Barlow Condensed',system-ui", letterSpacing: ".06em", display: "grid", placeItems: "center", pointerEvents: "auto", touchAction: "none", boxShadow: "0 4px 12px #0008, inset 0 0 12px " + col + "55", backdropFilter: "blur(3px)" });
      const dn = e => { K[code] = true; b.style.filter = "brightness(1.35)"; e.preventDefault(); }, up = () => { K[code] = false; b.style.filter = ""; };
      b.addEventListener("pointerdown", dn); b.addEventListener("pointerup", up); b.addEventListener("pointercancel", up); b.addEventListener("pointerleave", up); ui.appendChild(b); }
    const hp = document.getElementById("help"); if (hp) hp.style.display = "none"; const hb = document.getElementById("hb"); if (hb) hb.style.display = "none"; const en = document.querySelector('a[href="entrenamiento.html"]'); if (en) en.style.display = "none";
  })();
  addEventListener("pointerdown", () => { TS.tap = true; });
  // mapa de botones del mando: el de MDG27 (Ajustes > mando) si viene del juego, o el configurado aquí en la pausa
  const PADDEF = { pass: 0, shoot: 1, lob: 2, through: 3, sw: 4, skill: 5, jockey: 6, sprint: 7, stop: 10, spin: 11, pause: 9 };
  let PADMAPS = {}; try { PADMAPS = JSON.parse(localStorage.getItem("mdg27padmap") || "{}"); } catch (e) {}
  const padMapFor = gp => Object.assign({}, PADDEF, (EMB && EMB.padmap && EMB.padmap[gp.id]) || {}, PADMAPS[gp.id] || {});
  function input() {
    let mx = (K.KeyD || K.ArrowRight ? 1 : 0) - (K.KeyA || K.ArrowLeft ? 1 : 0), my = (K.KeyS || K.ArrowDown ? 1 : 0) - (K.KeyW || K.ArrowUp ? 1 : 0);
    let I = { spr: !!(K.ShiftLeft || K.ShiftRight), shoot: !!(K.Space || K.KeyK), pass: !!(K.KeyJ || K.KeyE), lob: !!K.KeyL, thru: !!K.KeyI, fin: !!K.KeyF, sw: !!(K.KeyQ || K.Tab), walk: !!(K.ControlLeft || K.KeyC), spin: !!K.KeyR, stop: !!K.KeyT, feint: !!K.KeyZ, nut: !!K.KeyX, step: !!K.KeyV, ctx: !!K.KeyG };
    if (TS.on && Math.hypot(TS.x, TS.y) > .12) { mx = TS.x; my = TS.y; }
    let gps = []; try { gps = navigator.getGamepads ? [...navigator.getGamepads()] : []; } catch (e) {} const gp = gps.find(p => p && p.connected);
    if (gp) { const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0; if (Math.hypot(ax, ay) > .18) { mx = ax; my = ay; }
      const b = i => i != null && gp.buttons[i] && (gp.buttons[i].pressed || gp.buttons[i].value > .4), pm = padMapFor(gp);
      I.spr = I.spr || b(pm.sprint); I.fin = I.fin || b(pm.skill); I.shoot = I.shoot || b(pm.shoot); I.pass = I.pass || b(pm.pass); I.lob = I.lob || b(pm.lob); I.thru = I.thru || b(pm.through); I.sw = I.sw || b(pm.sw); I.ctx = I.ctx || b(pm.spin); I.stop = I.stop || b(pm.stop); I.walk = I.walk || b(pm.jockey);
      // cruceta (botones 12-15, o eje en mandos no estándar) también mueve
      { let dx = (b(15) ? 1 : 0) - (b(14) ? 1 : 0), dy = (b(13) ? 1 : 0) - (b(12) ? 1 : 0); if (gp.mapping !== "standard" && gp.axes.length > 9) { const h = gp.axes[9]; if (Math.abs(h) < 1.05 && h !== 0) { const a = Math.round((h + 1) * 3.5); if (a === 0) dy = -1; else if (a === 2) dx = 1; else if (a === 4) dy = 1; else if (a === 6) dx = -1; } } if ((dx || dy) && Math.hypot(mx, my) < .2) { mx = dx; my = dy; } }
      // stick derecho: golpe lateral = amago, adelante = caño/conducción larga, en diagonal adelante = bicicleta
      // (como el gesto de DLS) el regate sale según hacia dónde mueves el stick derecho respecto a donde corre tu jugador
      const rx = gp.axes[2] || 0, ry = gp.axes[3] || 0, rm = Math.hypot(rx, ry); if (rm > .75) { I.rs = Math.atan2(ry, rx); I.rsk = true; } }
    { const tu = document.getElementById("tui"); if (tu) { const want = gp ? "none" : ""; if (tu.style.display !== want) tu.style.display = want; } }   // con mando conectado se quitan los botones táctiles
    let m = Math.min(1, Math.hypot(mx, my)); if (I.walk && m > .3) m = .4;
    I.m = m; I.dir = m > .05 ? Math.atan2(my, mx) : null; I.my = my; I.mx = mx;
    for (const k of ["shoot", "pass", "lob", "thru", "sw", "spin", "stop", "feint", "nut", "step", "ctx", "rsk"]) { I[k + "D"] = I[k] && !prevB[k]; I[k + "U"] = !I[k] && prevB[k]; prevB[k] = I[k]; }
    return I;
  }

  /* ---------- movimiento ---------- */
  // energía: el esprint la gasta y se recupera trotando; con poca energía se corre menos
  const staK = p => .84 + .16 * (p.sta == null ? 1 : p.sta);
  const vRun = p => (5.9 + (p.st.pac - 70) * .03) * (.94 + .06 * staK(p)), vSpr = p => (7.3 + (p.st.pac - 70) * .065) * staK(p);
  // C = { dir, m, spr, face }  → la IA y el humano mueven igual
  function moveP(p, dt, C) {
    if (p.one || p.down > 0) return;
    let want = 0, wantH = p.mh;
    if (C.dir != null && C.m > .02) { wantH = C.dir; want = C.speed != null ? C.speed : C.m < .45 ? C.m / .45 * 1.6 : lerp(2.4, C.spr ? vSpr(p) : vRun(p), (C.m - .45) / .55); if (hasBall(p)) want = Math.min(want, C.spr ? vSpr(p) * .93 : 5.2); }
    const faceMode = C.face != null && want < 4.2;
    const hum = p === M.human || (R2 && R2.human === p), agi = .8 + (p.st.agi - 70) * .008, wMax = (hum ? lerp(16, hasBall(p) && p.v > 6 ? 4.6 : 6.2, clamp(p.v / 7.5, 0, 1)) : lerp(9.5, 2.6, clamp(p.v / 7.5, 0, 1))) * agi;   // el tuyo gira al momento (DLS)
    const dh = angD(p.mh, wantH), adh = Math.abs(dh);
    p.mh += clamp(dh, -(faceMode ? 9 : wMax) * dt, (faceMode ? 9 : wMax) * dt);
    if (faceMode) p.h += clamp(angD(p.h, C.face), -8 * dt, 8 * dt); else p.h += clamp(angD(p.h, p.mh), -wMax * 1.6 * dt, wMax * 1.6 * dt);
    const tgt = want * (adh > .5 && !faceMode ? clamp(1 - (adh - .5) * (hum ? .22 : .35), hum ? .6 : .45, 1) : 1) * (faceMode ? Math.min(1, 3.3 / Math.max(want, .1)) : 1);
    const accel = (tgt > p.v ? (p.v < 3 ? 6 : 3.6) * (.85 + (p.st.acc - 70) * .01) : (p.v > 5 ? (hum ? 4.2 : 7) : 8.5)) * (hum ? 1.75 : 1);   // inercia: lanzado a tope cuesta frenar
    p.v += clamp(tgt - p.v, -accel * dt, accel * dt);
    p.x += Math.cos(p.mh) * p.v * dt; p.y += Math.sin(p.mh) * p.v * dt;
    const om = clamp(dh, -wMax * dt, wMax * dt) / Math.max(dt, 1e-3); p.lean = lerp(p.lean, clamp(-om * p.v * .016, -.22, .22), Math.min(1, dt * 6));
    p.x = clamp(p.x, -4, L + 4); p.y = clamp(p.y, -4, W + 4);
  }

  /* ---------- conducción por jugador (toques planificados al pie, como en la fase 1) ---------- */
  const tv = new THREE.Vector3();
  function footLocal(p, f) { flushPose(p); p.toes[f].getWorldPosition(tv); const fxw = tv.x + L / 2 - p.x, fyw = tv.z + W / 2 - p.y, hx = Math.cos(p.h), hy = Math.sin(p.h); return { a: fxw * hx + fyw * hy, l: -fxw * hy + fyw * hx, x: tv.x + L / 2, y: tv.z + W / 2 }; }
  function contactPoint(p, T, dirH, f) {
    const h2 = p.h + clamp(angD(p.h, dirH), -2.2 * T, 2.2 * T), v = p.v, px = p.x + Math.cos(p.h) * v * T * .5 + Math.cos(h2) * v * T * .5, py = p.y + Math.sin(p.h) * v * T * .5 + Math.sin(h2) * v * T * .5;
    const ah = p.dr.fwd != null ? p.dr.fwd : .35, lt = f === "R" ? .1 : -.1;
    return { x: px + Math.cos(h2) * ah - Math.sin(h2) * lt, y: py + Math.sin(h2) * ah + Math.cos(h2) * lt, h: h2 }; }
  const hasBall = p => M.owner === p;
  function dribble(p, dt, C) {
    const dr = p.dr; if (p.one || p.kickLock || !p.locoA || p.down > 0) { dr.plan = null; return; }
    const dx = ball.x - p.x, dy = ball.y - p.y, hx = Math.cos(p.h), hy = Math.sin(p.h), ahead = dx * hx + dy * hy, lat = -dx * hy + dy * hx, d = Math.hypot(dx, dy);
    if (dr.loose > 0) { dr.plan = null; return; }
    if (ball.z > .35 || d > 2.2) { dr.plan = null; return; }
    const ctl = .8 + (p.st.dri - 70) * .012, spr = C.spr && p.v > 5.3, wantH = C.dir == null ? p.h : C.dir;
    if (p.v < .9) { dr.plan = null; const tx = p.x + hx * .42, ty = p.y + hy * .42, a = Math.min(1, dt * 6); if (d < 1.4) { ball.vx += ((tx - ball.x) * 3 - ball.vx) * a; ball.vy += ((ty - ball.y) * 3 - ball.vy) * a; } return; }
    const phRate = (p.Phi - p.prevPhi) / Math.max(dt, 1e-4);
    let foot = null;
    for (const f of ["R", "L"]) { const fl = footLocal(p, f), st = dr[f] || (dr[f] = { a: fl.a, up: false });
      if (st.up && fl.a < st.a - .004 && st.a > .05) { foot = f; dr.fwd = dr.fwd == null ? st.a : lerp(dr.fwd, st.a, .3); }
      st.up = fl.a > st.a + .002 ? true : fl.a < st.a - .002 ? false : st.up; st.a = fl.a; }
    if (foot && simT - dr.lastT > .12) {
      const fl = footLocal(p, foot), fd = Math.hypot(ball.x - fl.x, ball.y - fl.y);
      const near = fd < .5 || (dr.plan && Math.hypot(ball.x - dr.plan.x, ball.y - dr.plan.y) < .6) || (ahead > -.1 && ahead < .9 && Math.abs(lat) < .45);
      const skip = spr && (dr.sk = !dr.sk);
      if (near && !skip) {
        dr.lastT = simT; dr.lastFoot = foot; touchBy(p);
        const T = clamp((spr ? 1 : .5) / Math.max(.4, phRate), .16, 1.1), cp = contactPoint(p, T, wantH, spr ? foot : foot === "R" ? "L" : "R");
        const lead = .11 + (1 - ctl) * .15 + (spr ? .55 : 0), tx = cp.x + Math.cos(cp.h) * lead, ty = cp.y + Math.sin(cp.h) * lead;
        const D = Math.hypot(tx - ball.x, ty - ball.y), v0 = clamp(rollV0(D, T), 0, p.v * 2.2 + 1.5), a = Math.atan2(ty - ball.y, tx - ball.x) + (Math.random() - .5) * (1.15 - ctl) * .1;
        ball.vx = Math.cos(a) * v0; ball.vy = Math.sin(a) * v0; ball.vz = 0; dr.plan = { x: tx, y: ty, t: simT + T, h: cp.h }; if (p === M.human) touchSfx(1 + p.v * .35);
      }
    }
    if (C.dir != null && d < 1.5 && simT - dr.lastT > .16 && Math.abs(angD(dr.plan ? dr.plan.h : p.h, wantH)) > .55) {
      const fR = footLocal(p, "R"), fL = footLocal(p, "L"), f = Math.hypot(ball.x - fR.x, ball.y - fR.y) < Math.hypot(ball.x - fL.x, ball.y - fL.y) ? "R" : "L";
      const T = clamp(.22 + p.v * .015, .2, .4), cp = contactPoint(p, T, wantH, f === "R" ? "L" : "R"), tx = cp.x + Math.cos(cp.h) * .11, ty = cp.y + Math.sin(cp.h) * .11;
      const D = Math.hypot(tx - ball.x, ty - ball.y), v0 = clamp(rollV0(D, T), 0, p.v * 2 + 2), a = Math.atan2(ty - ball.y, tx - ball.x);
      ball.vx = Math.cos(a) * v0; ball.vy = Math.sin(a) * v0; dr.lastT = simT; dr.lastFoot = f; dr.plan = { x: tx, y: ty, t: simT + T, h: cp.h }; touchBy(p); }
    // recuperación: si el balón se queda atrás o se abre demasiado (giros a toda velocidad, fotogramas lentos), el jugador ajusta la zancada y lo vuelve a poner delante
    if (dr.plan && dr.plan.t < simT - .3) dr.plan = null;
    if (d < 2.2 && (ahead < .1 || Math.abs(lat) > .62) && simT - dr.lastT > .2) {
      const fR = footLocal(p, "R"), fL = footLocal(p, "L"), f = Math.hypot(ball.x - fR.x, ball.y - fR.y) < Math.hypot(ball.x - fL.x, ball.y - fL.y) ? "R" : "L";
      const T = clamp(.26 + p.v * .02, .26, .45), cp = contactPoint(p, T, wantH, f === "R" ? "L" : "R"), tx = cp.x + Math.cos(cp.h) * (.15 + (spr ? .3 : 0)), ty = cp.y + Math.sin(cp.h) * (.15 + (spr ? .3 : 0));
      const D = Math.hypot(tx - ball.x, ty - ball.y), v0 = clamp(rollV0(D, T), 0, p.v * 2.3 + 3), a = Math.atan2(ty - ball.y, tx - ball.x);
      ball.vx = Math.cos(a) * v0; ball.vy = Math.sin(a) * v0; dr.lastT = simT; dr.lastFoot = f; dr.plan = { x: tx, y: ty, t: simT + T, h: cp.h }; touchBy(p); if (ahead < -.2) p.v *= .9; }
    if (dr.plan && dr.plan.t > simT + .06) {
      const T = dr.plan.t - simT, cp = contactPoint(p, T, wantH, dr.lastFoot === "R" ? "L" : "R"), tx = cp.x + Math.cos(cp.h) * .11, ty = cp.y + Math.sin(cp.h) * .11, D = Math.hypot(tx - ball.x, ty - ball.y), v0 = clamp(rollV0(D, T), 0, p.v * 2.2 + 1.5), a = Math.atan2(ty - ball.y, tx - ball.x);
      const k = Math.min(1, dt * 5 * ctl); ball.vx += (Math.cos(a) * v0 - ball.vx) * k; ball.vy += (Math.sin(a) * v0 - ball.vy) * k;
    } else if (!dr.plan && d < 1.2 && ahead > -.2) { const tx = p.x + hx * (.6 + p.v * .25), ty = p.y + hy * (.6 + p.v * .25), k = Math.min(1, dt * 4); ball.vx += ((tx - ball.x) * 2.5 + p.v * hx - ball.vx) * k; ball.vy += ((ty - ball.y) * 2.5 + p.v * hy - ball.vy) * k; }
    if (p.v > 6.2 && C.dir != null && Math.abs(angD(p.h, C.dir)) > 1.7 && Math.random() < dt * (3 - ctl * 1.6)) { dr.loose = .45; dr.plan = null; }
  }

  /* ---------- posesión, toques y fuera de juego ---------- */
  function touchBy(p) {
    if (DR) drTouch(p);
    if (!DR && M.pass && M.pass.offside && M.pass.offside.has(p) && M.phase === "play") { callOffside(p); return; }
    if (M.pass && p !== M.pass.from) { const k = M.pass.k, d = (M.pl = M.pl || {})[k] || (M.pl[k] = { n: 0, ok: 0, int: 0 }); if (p.t === M.pass.t) { TEAMS[p.t].stats.pc++; d.ok++; } else d.int++; }
    if (M.last && M.last !== p && M.last.t === p.t && !M.last.gk) M.assist = M.last; else if (M.last && M.last.t !== p.t) M.assist = null;
    if (M.owner && M.owner.t !== p.t || (!M.owner && M.last && M.last.t !== p.t)) { M.turnT = simT; M.turnLost = 1 - p.t; }
    M.pass = null; M.last = p; if (M.owner !== p) { M.owner = p; p.ai.gotT = simT; onOwner(p); const pr = openness(p, p.t); p.ai.t = pr < 2.5 ? .25 + Math.random() * .3 : .6 + Math.random() * .9; }
  }
  // segundo jugador humano (el invitado online, equipo 1): se usa el mismo código de control cambiando el "contexto"
  const R2 = NET ? { human: null, team: 1, swT: 0, charge: null, lastI: { dir: null }, prev: {} } : null;
  function withR2(fn) { const sv = [M.human, M.humanTeam, M.swT, charge, lastI]; M.human = R2.human; M.humanTeam = R2.team; M.swT = R2.swT; charge = R2.charge; lastI = R2.lastI;
    let r; try { r = fn(); } finally { R2.human = M.human; R2.swT = M.swT; R2.charge = charge; R2.lastI = lastI; [M.human, M.humanTeam, M.swT, charge, lastI] = sv; } return r; }
  function remoteInput() { const d = NET.rin || { mx: 0, my: 0, b: 0 }, B = ["spr", "shoot", "pass", "lob", "thru", "fin", "sw", "walk", "spin", "stop", "feint", "nut", "step", "ctx"], I = {};
    B.forEach((k, i) => I[k] = !!(d.b & (1 << i))); let m = Math.min(1, Math.hypot(d.mx, d.my)); if (I.walk && m > .3) m = .4; I.m = m; I.dir = m > .05 ? Math.atan2(d.my, d.mx) : null; I.mx = d.mx; I.my = d.my;
    for (const k of ["shoot", "pass", "lob", "thru", "sw", "spin", "stop", "feint", "nut", "step", "ctx"]) { I[k + "D"] = I[k] && !R2.prev[k]; I[k + "U"] = !I[k] && R2.prev[k]; R2.prev[k] = I[k]; } return I; }
  const NETB = ["spr", "shoot", "pass", "lob", "thru", "fin", "sw", "walk", "spin", "stop", "feint", "nut", "step", "ctx"];
  function onOwner(p) { if (p.t === M.humanTeam && !p.gk) setHuman(p); else if (R2 && NET.peer && p.t === R2.team && !p.gk) R2.human = p; }
  function updatePossession(dt) {
    if (M.phase !== "play") return;
    if (M.owner) { const o = M.owner, d = Math.hypot(ball.x - o.x, ball.y - o.y); if (d > 2.3 || ball.z > 1 || o.down > 0) M.owner = null; }
    if (ball.hold) return;
    // balón suelto y lento cerca de un jugador: lo controla (o lo despeja si va alto)
    if (!M.owner || Math.hypot(ball.x - M.owner.x, ball.y - M.owner.y) > .8) {
      let best = null, bd = 1e9;
      const bsp = Math.hypot(ball.vx, ball.vy);
      // tramo que recorre el balón en este fotograma: un pase tenso ya no «atraviesa» al receptor entre dos fotogramas
      const sx = ball.vx * dt, sy = ball.vy * dt, sl2 = sx * sx + sy * sy || 1e-9;
      const segD = p => { const u = clamp(((p.x - ball.x) * sx + (p.y - ball.y) * sy) / sl2, 0, 1); return [Math.hypot(ball.x + sx * u - p.x, ball.y + sy * u - p.y), u]; };
      for (const p of P) { if (p.one || p.down > 0 || p.gk || p.kickLock || p.sent || p.nutT > simT) continue; const sg = segD(p), d = Math.min(Math.hypot(ball.x - p.x, ball.y - p.y), sg[0]), mine = M.pass && M.pass.to === p; let rr = mine ? 1.45 : .95; p._segU = sg[1];
        // pase tenso: el rival solo lo corta si está casi encima de la línea, y no siempre (según su defensa)
        if (!mine && M.pass && p.t !== M.pass.t && bsp > 11 && M.pass.k !== "cross") { rr = .62; if (d < rr) { const tr = M.pass.tr || (M.pass.tr = {}); if (tr[p.i] == null) tr[p.i] = Math.random() < .3 + (p.st.def - 70) * .012 + (bsp < 16 ? .2 : 0); if (!tr[p.i]) continue; } } if (d < rr && ball.z < (mine ? 1 : .7) && d - (mine ? .4 : 0) < bd && !(p.dr.loose > 0)) { best = p; bd = d - (mine ? .4 : 0); } }
      if (best && best !== M.owner) {
        if (best._segU > 0 && Math.hypot(ball.x - best.x, ball.y - best.y) > (M.pass && M.pass.to === best ? 1.45 : .95)) { ball.x += ball.vx * dt * best._segU; ball.y += ball.vy * dt * best._segU; }   // el balón se queda donde lo alcanza
        const rv = Math.hypot(ball.vx - Math.cos(best.mh) * best.v, ball.vy - Math.sin(best.mh) * best.v);
        if (rv > 3.5 || !M.owner) control(best, rv); else if (M.owner && M.owner.t !== best.t) contest(best, M.owner);
      }
    }
    if (M.owner) TEAMS[M.owner.t].stats.pos += dt;
  }
  // primer toque: amortigua el balón según el control del jugador
  function control(p, rv) {
    const q = clamp((p.st.dri + p.st.pas) / 165 - rv * .007, .45, 1); let wantH = p === M.human && lastI.dir != null ? lastI.dir : p.h;
    if (p !== M.human) { const gh = Math.atan2(W / 2 - p.y, opp(p.t) - p.x), free = !team(1 - p.t).some(o => Math.hypot(o.x - (p.x + Math.cos(gh) * 4), o.y - (p.y + Math.sin(gh) * 4)) < 3.5); if (free && prog(p.t, p.x) > .3) wantH = p.h + clamp(angD(p.h, gh), -1.2, 1.2); }
    // cerca de una línea, el control nunca saca el balón del campo: se orienta hacia dentro
    { const vy = Math.sin(wantH), vx = Math.cos(wantH); if ((p.y < 4 && vy < 0) || (p.y > W - 4 && vy > 0)) wantH = Math.atan2(-vy * .3, vx || M.dirOf[p.t]); if ((p.x < 4 && vx < 0) || (p.x > L - 4 && vx > 0)) wantH = Math.atan2(vy, -vx * .3); }
    const knock = p === M.human && lastI.spr && lastI.dir != null ? 2.4 + (p.st.pac - 70) * .03 : 0;
    const sp = p.v * .88 + .4 + knock + (1 - q) * rv * .16, a = wantH + (Math.random() - .5) * (1 - q) * .5;
    const z0 = ball.z;
    ball.vx = Math.cos(a) * sp; ball.vy = Math.sin(a) * sp;
    if (z0 > .32 && !p.one) { // balón a media altura: control con el muslo, el balón cae amortiguado delante
      ball.vz = .6 + Math.random() * .4; ball.vx *= .55; ball.vy *= .55; startOne(p, "KneeingSoccerball", { ts: 1.1, t0: 0, end: .55, rootScale: 0, fadeIn: .06, h0: p.h }); }
    else { ball.vz = 0; ball.z = 0; }
    if (z0 < .05 && p.v < 1.2 && rv > 9 && !p.one) startOne(p, "ReceiveSoccerball", { ts: 1.6, t0: .1, end: .7, rootScale: 0, fadeIn: .08 });
    touchBy(p); if (Math.abs(sp) > 0) touchSfx(3);
    const ot = p.oneTouch; p.oneTouch = null;
    if (ot && p === M.human && simT - ot.at < 1.6 && z0 < .9) { ball.vx *= .3; ball.vy *= .3; humanKick(p, { k: ot.k, p: ot.k === "shot" ? .75 : .55 }, Object.assign({}, lastI)); }
  }
  // disputa: el que no la tiene puede robarla si llega primero al balón
  // choque hombro con hombro: corriendo en paralelo pegados, el más fuerte gana la posición; el otro trastabilla
  // pelea por la espalda: el defensor pegado detrás empuja o agarra; cubriendo bien (C / LT) y con más físico se aguanta
  // la IA cambia de actitud según el marcador y el minuto (si el usuario no la ha fijado)
  function aiMent() { if (DR) return; if ((aiMent.t = (aiMent.t || 0) + 1) % 60) return; const mn = curMin();
    TEAMS.forEach((T, t) => { if ((t === M.humanTeam && !M.lockP) || T.mentLock) return; const df = T.score - TEAMS[1 - t].score;
      T.ment = df < 0 ? (mn > 80 ? 2 : mn > 60 ? 1 : 0) : df > 0 ? (mn > 75 ? -1 : 0) : (mn > 85 ? 1 : 0); }); }
  function backBattle(dt) { if (DR) return; const o = M.owner; if (!o || M.phase !== "play" || o.one || o.gk || o.down > 0) return;
    for (const d of team(1 - o.t)) { if (d.gk || d.one || d.down > 0 || d === M.human) continue; const dx = d.x - o.x, dy = d.y - o.y, dd = Math.hypot(dx, dy); if (dd > 1 || dd < .25) continue;
      const behind = -(dx * Math.cos(o.h) + dy * Math.sin(o.h)); if (behind < .35) continue; if (Math.random() > dt * .5) continue;
      const shield = o.shield && simT - o.shield < .4, edge = (o.st.phy - d.st.phy) * .012 + (shield ? .22 : 0);
      if (Math.random() < .5 + edge) { startOne(d, "ShoveReaction", { ts: 1.3, h0: d.h, end: 1, fadeIn: .1, rootScale: .5 }); d.down = .45; }      // aguanta: el defensor sale rebotado
      else if (Math.random() < .3) { foul(d, o, false); msg("¡AGARRÓN!", 1.2); }                                                                  // agarrón: falta
      else { startOne(o, "ShoveReaction", { ts: 1.3, h0: o.h, end: 1, fadeIn: .1, rootScale: .5 }); o.dr.loose = .6; M.owner = null; touchBy(d); }  // le gana la posición
      break; } }
  function shoulderDuel(dt) { if (DR) return; const o = M.owner; if (!o || M.phase !== "play" || o.one || o.gk || o.v < 3) return;
    for (const d of team(1 - o.t)) { if (d.gk || d.one || d.down > 0) continue; const dx = d.x - o.x, dy = d.y - o.y, dd = Math.hypot(dx, dy); if (dd > 1.05 || dd < .3) continue;
      if (Math.abs(angD(o.mh, d.mh)) > .7 || d.v < 2.5) continue; const lat = Math.abs(-dx * Math.sin(o.mh) + dy * Math.cos(o.mh)); if (lat < .45) continue;
      if (Math.random() > dt * 1.1) continue; const pDef = .45 + (d.st.phy - o.st.phy) * .015 + (d.st.def - o.st.dri) * .006;
      if (Math.random() < pDef) { startOne(o, o.v < 3.5 ? "ShoveReaction" : "JoggingStumble", { ts: 1.3, h0: o.h, end: 1.2, fadeIn: .1, rootScale: .6 }); o.dr.loose = .7; M.owner = null; const a = d.mh; ball.vx = Math.cos(a) * (d.v + .5); ball.vy = Math.sin(a) * (d.v + .5); touchBy(d); touchSfx(3); }
      else { startOne(d, "JoggingStumble", { ts: 1.3, h0: d.h, end: 1.2, fadeIn: .1, rootScale: .6 }); d.down = .6; }
      break; } }
  function contest(p, o) { if (Math.random() < (.5 + (p.st.def - o.st.dri) * .01) * (o.shield && simT - o.shield < .3 ? .35 : 1)) { touchBy(p); const a = Math.atan2(ball.y - o.y, ball.x - o.x); ball.vx = Math.cos(a) * 3; ball.vy = Math.sin(a) * 3; } }

  /* ---------- golpeos (mismo sistema que la fase 1, para todos los jugadores) ---------- */
  const KC = { shot: { st: "KickSoccerball1", run: "StrikeFowardJog" }, pass: { st: "SoccerPass", run: "SoccerPass" }, lob: { st: "Chip", run: "Chip" }, thru: { st: "SoccerPass", run: "SoccerPass" }, cross: { st: "KickSoccerball1", run: "StrikeFowardJog" }, clear: { st: "KickSoccerball1", run: "StrikeFowardJog" } };
  function requestKick(p, r) { p.req = Object.assign({ at: simT }, r); }
  function tryKick(p) {
    const r = p.req; if (!r || p.one || p.down > 0) return; if (simT - r.at > (r.k === "shot" && M.penT && simT - M.penT < 4 ? 3 : M.pass && M.pass.to === p ? 3.2 : 1.6)) { p.req = null; return; }
    const moving = p.v > 2.6, pen = r.k === "shot" && M.penT && simT - M.penT < 4 && !moving && META.SoccerPenaltyKick, base = pen ? "SoccerPenaltyKick" : moving ? KC[r.k].run : KC[r.k].st;
    const dx = ball.x - p.x, dy = ball.y - p.y, lat = -dx * Math.sin(p.h) + dy * Math.cos(p.h);
    const aimH = Math.atan2(r.ty - ball.y, r.tx - ball.x), turn = angD(p.h, aimH);
    const left = (lat < -.12 || (lat < .1 && turn < -.6)) && Math.random() < .85;
    const name = left && META[base + "_M"] ? base + "_M" : base, m = META[name];
    const ts = moving ? clamp(p.v / Math.max(1.5, m.speed || 2.3), .9, 1.6) : 1.2, tc = m.kick.t / ts, pb = predictBall(tc);
    const hC = p.h + clamp(turn, -1.3, 1.3), cx = Math.cos(hC), cy = Math.sin(hC);
    const needX = pb.x - (cx * m.kick.fz + cy * m.kick.fx), needY = pb.y - (cy * m.kick.fz - cx * m.kick.fx);
    const ex = needX - p.x, ey = needY - p.y, e = Math.hypot(ex, ey);
    if (e > (pen ? 3.2 : moving ? 1.7 : 1.2) || pb.z > .8) return;
    p.req = null; p.kickLock = true;
    const o = startOne(p, name, { ts, h0: hC, warp: { x: ex, y: ey, t: m.kick.t }, turnTo: hC, turnT: m.kick.t * .8, fadeIn: .08, end: Math.min(m.dur, m.kick.t + .7) });
    o.onT = m.kick.t; o.on = () => strike(p, r, left);
    o.after = () => { p.kickLock = false; p.v = Math.min(p.v, 3.5); };
  }
  function strike(p, r, left) {
    flushPose(p); const toe = left ? p.toes.L : p.toes.R; toe.getWorldPosition(tv);
    const miss = Math.hypot(tv.x + L / 2 - ball.x, tv.z + W / 2 - ball.y), q = clamp(1 - Math.max(0, miss - .35) * 1.4, .25, 1);
    const weak = left ? .86 : 1, run = p.v > 5.5 ? .1 : 0, st = r.k === "shot" ? p.st.sho : p.st.pas;
    const err0 = r.pen ? .03 + (100 - st) * .0015 + (r.tz > 2.15 ? .32 : 0) : (1 - q) * .35 + (1 - weak) * .3 + run + (r.fin ? -.05 : 0) + (100 - st) * .004 + (r.press || 0) + (r.k === "shot" ? (p === M.human ? .21 : .26) + Math.max(0, Math.hypot(r.tx - ball.x, r.ty - ball.y) - 11) * .016 + (nearestOpp(p) < 1.6 ? .08 : 0) : 0) + (r.pow ? .07 : 0);
    const err = r.fk ? .05 + (100 - st) * .0025 + Math.max(0, (r.p || .6) - .85) * 1.2 : r.perf ? err0 * .55 : r.chip ? err0 * .6 : err0;   // falta con diana: la precisión la pones tú
    const pw = r.p != null ? r.p : .6;
    if (ball.hold && ball.hold !== p) return;                     // el portero ya la tiene en las manos
    if (miss > 1.6 && !(M.set && M.set.taker === p)) return;      // el balón ya no está ahí: patada al aire
    ball.hold = null; M.owner = null; p.dr.loose = .6; p.dr.plan = null;
    let a, sp, vz, wz = 0, topspin = 6;
    const D = Math.hypot(r.tx - ball.x, r.ty - ball.y);
    if (r.k === "shot" && r.chip) {   // vaselina: sube por encima del portero y baja antes del larguero
      const tri = () => Math.random() + Math.random() - 1, ty = r.ty + tri() * err * 3, d = Math.hypot(r.tx - ball.x, ty - ball.y), T = clamp(d / 13, .9, 2.2);
      sp = d / T; vz = (clamp(r.tz + tri() * err * 1.2, .8, 2.6) - ball.z + .5 * G * T * T) / T; a = Math.atan2(ty - ball.y, r.tx - ball.x); topspin = -4;
      TEAMS[p.t].stats.sh++; M.shot = { p, t: simT, chip: true }; var doGk = true; if (!window.STEP) msg("¡VASELINA!", 1); }
    else if (r.k === "shot") {
      sp = (r.fin ? 17 + pw * 9 : 16 + pw * 16 + (p.st.sho - 70) * .08) * (.75 + q * .25) * weak * (r.perf ? 1.07 : 1);
      if (r.pow) { sp *= 1.3 + (p.st.sho - 75) * .004; if (!window.STEP) { msg("¡TRALLAZO!", 1); try { cam.position.y += .15; } catch (e) {} } }
      const tri = () => Math.random() + Math.random() - 1, ty = r.ty + tri() * err * (4.5 + D * .3), d = Math.hypot(r.tx - ball.x, ty - ball.y), t = d / (sp * .93);
      const tz = clamp((r.tz != null ? r.tz : .25 + pw * 1.5) + (pw > .82 && !r.pen && !r.fk ? (pw - .82) * 6 * (1.2 - q) : 0) + tri() * err * (1.4 + D * .06), .1, 4.5);
      vz = (tz - ball.z + .5 * G * t * t) / t; a = Math.atan2(ty - ball.y, r.tx - ball.x);
      if (r.fk) { const f = fkSolve(sp, d, tz); vz = f.vz; topspin = f.ts; }   // falta: efecto hacia abajo, pasa por encima de la barrera y cae a la diana
      if (r.fin) { const s = Math.sign(W / 2 - r.ty) || 1; wz = -s * 26 * Math.sign(r.tx - ball.x); const curl = .5 * .0042 * 26 * sp * t * t; a = Math.atan2(ty + s * curl - ball.y, r.tx - ball.x); }
      if (r.pen) topspin = 0;   // penalti: sin efecto, el balón va a donde apuntas
      TEAMS[p.t].stats.sh++; M.shot = { p, t: simT, perf: !!r.perf, fin: !!r.fin }; var doGk = true; if (r.perf && !window.STEP) msg("¡TIRO PERFECTO!", .9);
      // trivela: rosca con el exterior (los buenos tiradores, a veces, al tirar cruzado con el pie bueno)
      else if (r.fin && !left && p.st.sho > 76 && Math.random() < .3) { wz *= -1.1; const s2 = -(Math.sign(W / 2 - r.ty) || 1), curl2 = .5 * .0042 * 28 * sp * t * t; a = Math.atan2(ty + s2 * curl2 - ball.y, r.tx - ball.x); M.shot.tri = true; if (!window.STEP) msg("¡CON EL EXTERIOR!", 1); }
    } else if (r.k === "pass" || r.k === "thru") {
      const T = clamp(D / (r.k === "thru" ? 16 : 18.5), .32, 2.4) * (1.1 - pw * .2);   // pases rasos firmes pero controlables
      sp = clamp(rollV0(D, T), 8.5, r.soft ? 13 : 25) * (.94 + q * .06); vz = 0;   // pase al vacío: más suave
      a = aimH(r) + (Math.random() - .5) * err * .22; topspin = 6;
      TEAMS[p.t].stats.pa++; registerPass(p, r);
    } else { // centro, pase alto, despeje, vaselina
      const T = clamp(.55 + D * .033, .8, 2.6) * (r.k === "clear" ? .9 : 1), apex = r.k === "lob" ? 1 : 0;
      sp = D / T * 1.08 * (.92 + q * .08); vz = (r.tz != null ? r.tz : .4) - ball.z + .5 * G * T; vz = vz / T * T; vz = ((r.tz != null ? r.tz : .4) - ball.z + .5 * G * T * T) / T + apex;
      a = aimH(r) + (Math.random() - .5) * err * .18; topspin = -8;
      if (r.k !== "clear") { TEAMS[p.t].stats.pa++; registerPass(p, r); }
    }
    // un pase que va a puerta cuenta como tiro: el portero reacciona y puede pararlo (antes entraba solo)
    if (r.k !== "shot" && !r.pen) { const gx = opp(p.t), ca = Math.cos(a); if (Math.sign(gx - ball.x) === Math.sign(ca) && Math.abs(ca) > .05) { const tl = (gx - ball.x) / ca, yy = ball.y + Math.sin(a) * tl; if (Math.abs(yy - W / 2) < GW / 2 + .6 && tl < 45) { doGk = true; M.shot = { p, t: simT, pas: 1 }; } } }
    ball.vx = Math.cos(a) * sp; ball.vy = Math.sin(a) * sp; ball.vz = vz; ball.z = Math.max(ball.z, .02); ball.wz = wz; ball.wx = -Math.sin(a) * topspin; ball.wy = Math.cos(a) * topspin;
    kickSnd(sp); M.last = p;
    // DLS: después de golpear, mover el stick le da efecto al balón (y arriba/abajo lo baja o lo eleva)
    M.aft = (p === M.human || r.fk) && !r.pen && (r.k === "shot" || r.k === "cross" || r.k === "lob") ? { t: simT, a, p, k: r.k, d0: lastI.m > .3 ? lastI.dir : null, arm: !(lastI.m > .3) } : null;
    if (doGk) { gkReact(1 - p.t); (M.shotLog = M.shotLog || []).push({ d: +Math.hypot(r.tx - ball.x, r.ty - ball.y).toFixed(1), sp: +sp.toFixed(1), gk: gkS[1 - p.t].mode, gkd: +Math.hypot(GKP(1 - p.t).x - ball.x, GKP(1 - p.t).y - ball.y).toFixed(1), ty: +(r.ty - W / 2).toFixed(1), gy: +(GKP(1 - p.t).y - W / 2).toFixed(1), gl: +Math.abs(GKP(1 - p.t).x - own(1 - p.t)).toFixed(1), by: +(ball.y - W / 2).toFixed(1), g1: GKP(1 - p.t).one ? GKP(1 - p.t).one.n : '', down: GKP(1 - p.t).down > 0 }); }
  }
  const aimH = r => Math.atan2(r.ty - ball.y, r.tx - ball.x);
  // trayectoria de una falta: busca el efecto (topspin) y la subida justos para que pase la barrera y llegue a la altura de la diana
  function fkSolve(sp, D, tz) {
    const dw = STREET ? 4.5 : 9.15, sim = (vz, ts) => { let vh = sp, z = ball.z, x = 0, zw = null; const h = 1 / 120;
      for (let i = 0; i < 600 && x < D; i++) { const s = Math.hypot(vh, vz), kd = .0125 * s; vh -= kd * vh * h; vz -= (kd * vz + G) * h; vz -= .0042 * ts * vh * h; z += vz * h; x += vh * h; if (zw == null && x >= dw) zw = z; }
      return { z, zw: zw == null ? z : zw }; };
    let best = null;
    for (const ts of [10, 18, 26, 34, 42, 50, 58, 66, 74]) { let lo = 0, hi = 22; for (let k = 0; k < 22; k++) { const m = (lo + hi) / 2; if (sim(m, ts).z < tz) lo = m; else hi = m; }
      const vz = (lo + hi) / 2, r = sim(vz, ts); best = { vz, ts, zw: r.zw }; if (r.zw > 2.45) break; }
    return best;
  }
  // efecto después del golpeo (como deslizar el dedo en DLS): sólo el primer medio segundo y mientras nadie la toque
  function aftStep(I) {
    const A = M.aft; if (!A) return; const el = simT - A.t;
    if (el > .5 || M.owner || ball.hold || M.last !== A.p || (ball.z <= .01 && Math.hypot(ball.vx, ball.vy) < 3)) { M.aft = null; return; }
    if (!A.arm) { if (I.dir == null || I.m < .3 || Math.abs(angD(I.dir, A.d0)) > .8) A.arm = true; else return; }   // el stick con el que apuntaste no cuenta: hay que moverlo
    if (el < .05 || I.dir == null || I.m < .3) return;
    let sx = I.mx, sy = I.my; if (M.camBehind && simT < M.camBehind.until) { const d = M.dirOf[A.p.t]; const wx = -sy * d, wy = sx * d; sx = wx; sy = wy; }   // cámara detrás del balón: arriba = hacia la portería
    const ca = Math.cos(A.a), sa = Math.sin(A.a), perp = ca * sy - sa * sx, fwd = ca * sx + sa * sy, dt = A.dt || 1 / 60;
    ball.wz = clamp(ball.wz + perp * 75 * dt, -30, 30);
    if (A.k === "shot") ball.vz -= fwd * 2.6 * dt;   // hacia delante: el balón cae antes · hacia atrás: sube
    if (Math.abs(perp) > .5 && !A.msg) { A.msg = 1; if (!window.STEP) msg("¡CON EFECTO!", .7); }
  }
  const nearestOpp = p => team(1 - p.t).reduce((m, o) => o.sent ? m : Math.min(m, Math.hypot(o.x - p.x, o.y - p.y)), 99);   // tirar con un rival encima resta precisión
  // al pasar: se marca quién está en fuera de juego en ese instante
  function registerPass(p, r) {
    const t = p.t, opps = team(1 - t).map(o => prog(t, o.x)).sort((a, b) => b - a), second = opps[1] != null ? opps[1] : 1, bp = prog(t, ball.x), off = new Set();
    for (const q of team(t)) if (q !== p && prog(t, q.x) > .5 && prog(t, q.x) > bp + .005 && prog(t, q.x) > second + .004 && !(r.k === "throw") && !STREET) { off.add(q); q.offAt = { x: q.x, y: q.y }; }
    M.pass = { from: p, t, to: r.to || null, at: simT, offside: off, k: r.k, stickH: lastI && lastI.m > .35 ? lastI.dir : null, free: !(lastI && lastI.m > .35) }; { const d = (M.pl = M.pl || {})[r.k] || (M.pl[r.k] = { n: 0, ok: 0, int: 0 }); d.n++; }
    if (r.to) r.to.ai.recv = { at: simT };
  }

  /* ---------- cabezazos ---------- */
  // duelo aéreo: entre los que llegan, gana el más fuerte/mejor colocado (con algo de suerte)
  function aerial(I) {
    // gana quien ataca el balón: llega con carrera, está delante (el balón le llega antes), salta mejor (físico) y está más cerca
    if (simT - (ball.hdrT || -9) < .35) return;   // recién cabeceado: nadie más lo toca en el mismo salto
    const bv = Math.hypot(ball.vx, ball.vy) || 1, ux = ball.vx / bv, uy = ball.vy / bv;
    const c = []; for (const p of P) { if (p.gk || p.one || p.down > 0 || p.dr.loose > 0 || p.sent) continue; const d = Math.hypot(ball.x - p.x, ball.y - p.y);
      if (p.wall && (d > .8 || ball.z > 2.22 + (p.st.phy - 70) * .004)) continue;   // la barrera salta, pero no llega a todo
      if (d < 1.35) { const front = -((p.x - ball.x) * ux + (p.y - ball.y) * uy), run = Math.min(1, p.v / 5) * Math.max(0, Math.cos(angD(p.mh, Math.atan2(-uy, -ux)) * .5));
        c.push({ p, s: p.st.phy * .015 + (p.cat === "def" ? .1 : 0) + run * .45 + clamp(front, -1, 1) * .35 - d * .7 + Math.random() * .8 }); } }
    if (!c.length) return; c.sort((a, b) => b.s - a.s); const w = c[0].p;
    if (w === M.human && (I.shoot || I.pass || I.lob)) w.hdrCmd = I.shoot ? "shot" : "pass";
    else if (w === M.human && w.hdrBuf && simT - w.hdrBuf.at < 1.6) w.hdrCmd = w.hdrBuf.cmd; if (w.hdrBuf) w.hdrBuf = null;
    tryHeader(w, c.length > 1);
  }
  // voleas: balón entre la rodilla y la cintura; en el área rival se remata, en la propia se despeja
  function volley(I) {
    if (simT - (ball.hdrT || -9) < .35) return; let p = null, bd = 1.05;
    for (const q of P) { if (q.gk || q.one || q.down > 0 || q.dr.loose > 0 || q.sent || q.kickLock) continue; const d = Math.hypot(ball.x - q.x, ball.y - q.y); if (d < bd) { bd = d; p = q; } }
    if (!p) return; const tg = p.t, pr = prog(tg, p.x), att = pr > .78 && Math.abs(p.y - W / 2) < 20, mineBox = pr < .2 && Math.abs(p.y - W / 2) < 22;
    const hum = p === M.human, cmd = hum ? (I.shoot ? "shot" : I.pass || I.lob ? "pass" : p.hdrBuf && simT - p.hdrBuf.at < 1.6 ? p.hdrBuf.cmd : null) : att ? (Math.random() < .4 ? "shot" : null) : mineBox ? "clear" : null;
    if (!cmd) return; if (M.pass && M.pass.offside && M.pass.offside.has(p)) { callOffside(p); return; }
    const gx = opp(tg); let tx, ty, tz, sp;
    if (cmd === "shot") { const g = GKP(1 - tg), side = Math.sign(W / 2 - g.y) || 1, er = .75 - (p.st.sho - 60) * .006; tx = gx + M.dirOf[tg] * .2; ty = W / 2 + side * (1 + Math.random() * 2.3) + (Math.random() + Math.random() - 1) * er * 6; tz = clamp(.4 + Math.random() * 1.6 + (Math.random() - .5) * er * 3, .1, 4); sp = 15 + p.st.sho * .08; TEAMS[tg].stats.sh++; }
    else if (cmd === "pass") { const mate = mateInDir(p, lastI.dir != null ? lastI.dir : p.h, 30) || bestMate(p, 25); tx = mate ? mate.x : p.x + M.dirOf[tg] * 15; ty = mate ? mate.y : p.y; tz = 0; sp = 13; }
    else { tx = p.x + M.dirOf[tg] * 30; ty = clamp(p.y + (p.y < W / 2 ? -10 : 10), 3, W - 3); tz = 0; sp = 22; }
    const D = Math.hypot(tx - ball.x, ty - ball.y), t = D / sp, a = Math.atan2(ty - ball.y, tx - ball.x);
    ball.vx = Math.cos(a) * sp; ball.vy = Math.sin(a) * sp; ball.vz = cmd === "shot" ? (tz - ball.z + .5 * G * t * t) / t : cmd === "clear" ? 7 : 3; ball.wx = ball.wy = ball.wz = 0;
    const left = angD(p.h, a) < 0, n = left && META.KickSoccerball1_M ? "KickSoccerball1_M" : "KickSoccerball1";
    // cabezazo en plancha: balón bajo y cruzado en el área, el delantero llega lanzado y se tira
    const plancha = cmd === "shot" && ball.z > .45 && ball.z < 1 && p.v > 4 && Math.hypot(ball.vx, ball.vy) > 8 && Math.random() < .55;
    if (plancha) { ball.vx *= .85; ball.vy *= .85; ball.vz = Math.min(ball.vz, 1); p.down = 1.7; p.dr.plan = null; const o = startOne(p, "FallFlat", { ts: 1.5, t0: .15, h0: a, end: 1.9, fadeIn: .05 }); if (o) o.after = () => startOne(p, "GettingUp", { ts: 1.6, t0: .5, end: 2.4, rootScale: 0 }); p.h = p.mh = a; }
    else { startOne(p, n, { ts: 1.15, t0: Math.max(0, META[n].kick.t - .1), end: .9, rootScale: 0, h0: a, fadeIn: .04 }); p.h = p.mh = a; }
    M.owner = null; touchBy(p); M.owner = null; p.dr.loose = .5; ball.hdrT = simT; kickSnd(cmd === "pass" ? 8 : 20);
    if (cmd === "shot") { M.shot = { p, t: simT, vol: 1 }; msg(plancha ? "¡CABEZAZO EN PLANCHA!" : "¡VOLEA!", 1.1); gkReact(1 - tg); } else if (cmd === "pass") registerPass(p, { k: "pass", to: null, tx, ty });
  }
  function tryHeader(p, duel) {
    if (p.one || p.down > 0 || p.gk || ball.z < 1.05 || ball.z > 2.8 || ball.vz > 5) return false;
    const d = Math.hypot(ball.x - p.x, ball.y - p.y); if (d > 1.35) return false;
    if (M.pass && M.pass.offside && M.pass.offside.has(p)) { callOffside(p); return true; }
    const tg = p.t, gx = opp(tg), cmd = p.hdrCmd; p.hdrCmd = null;
    // sin botón pulsado (o la IA sin rival encima): controla con el pecho en vez de cabecear a ciegas; si viene muy alto, la deja caer
    { const hum = p === M.human || (R2 && p === R2.human), box = prog(tg, p.x) > .8 && Math.abs(p.y - W / 2) < 20, hs = Math.hypot(ball.vx, ball.vy);
      if (!cmd && (hum || (!duel && !box && Math.random() < .6))) {
        if (ball.z > 1.8 || hs > 19) return false;
        const fh = hum && lastI.dir != null ? lastI.dir : p.h, k = clamp(1.1 + p.v * .7, 1, 5); ball.vx = Math.cos(fh) * k; ball.vy = Math.sin(fh) * k; ball.vz = -.5; ball.wx = ball.wy = ball.wz = 0;
        startOne(p, Math.random() < .5 ? "Receive" : "Receive_M", { ts: 1.5, t0: .45, end: 1.05, rootScale: 0, h0: p.h, fadeIn: .06 }); M.owner = null; touchBy(p); ball.hdrT = simT; touchSfx(4); return true; } }
    const attacking = cmd === "shot" || (cmd !== "pass" && prog(tg, p.x) > .74 && Math.abs(p.y - W / 2) < 20 && Math.cos(angD(Math.atan2(W / 2 - p.y, gx - p.x), M.dirOf[tg] > 0 ? 0 : Math.PI)) > .3);
    let tx, ty, tz, sp;
    if (attacking) { const g = GKP(1 - tg), side = Math.sign(W / 2 - g.y) || (Math.random() < .5 ? -1 : 1), q = clamp((p.st.sho + p.st.phy) / 170, .4, 1) * (duel ? .8 : 1);
      tx = gx + M.dirOf[tg] * .2; ty = W / 2 + side * (.8 + Math.random() * 2.4) + (Math.random() - .5) * (1 - q) * 4; tz = Math.random() < .6 ? .25 : 1.2 + Math.random() * 1.2; sp = (12 + p.st.phy * .045) * (.85 + q * .15); TEAMS[tg].stats.sh++; }
    else if (cmd === "pass") { const mate = mateInDir(p, lastI.dir != null ? lastI.dir : p.h, 30) || bestMate(p, 25); tx = mate ? mate.x : p.x + M.dirOf[tg] * 15; ty = mate ? mate.y : p.y; tz = 0; sp = 11; }
    else { const defending = prog(tg, p.x) < .35; const mate = defending ? null : bestMate(p, 25); tx = mate ? mate.x : p.x + M.dirOf[tg] * 22; ty = mate ? mate.y : clamp(p.y + (p.y < W / 2 ? -8 : 8), 2, W - 2); tz = 0; sp = defending ? 15 : 12; }
    const D = Math.hypot(tx - ball.x, ty - ball.y), t = D / sp, a = Math.atan2(ty - ball.y, tx - ball.x);
    ball.vx = Math.cos(a) * sp; ball.vy = Math.sin(a) * sp; ball.vz = attacking ? (tz - ball.z + .5 * G * t * t) / t : 3.5; ball.wx = ball.wy = ball.wz = 0;
    // chilena / tijera: atacando en el área, balón alto y (si es humano) con tiro pulsado; a veces la intenta la IA
    const chil = attacking && ball.z > 1.3 && ball.z < 2.4 && prog(tg, p.x) > .82 && (cmd === "shot" ? Math.random() < .5 : Math.random() < .12);
    if (chil) { const k = 1.35; ball.vx *= k; ball.vy *= k; ball.vz = ball.vz * .6 + .5; startOne(p, Math.random() < .5 ? "ScissorKick" : "ScissorKick_M", { ts: 1.25, t0: .62, end: 2.4, rootScale: 0, h0: a + Math.PI, fadeIn: .05 }); p.h = a + Math.PI; msg("¡CHILENA!", 1.2); }
    else { startOne(p, "SoccerHeader", { ts: 1.6, t0: .85, end: 1.8, rootScale: 0, h0: p.h, turnTo: a, turnT: 1 }); p.h = a; }
    M.owner = null; touchBy(p); M.owner = null; p.dr.loose = .5; ball.hdrT = simT; M.lastHdr = p; kickSnd(9);
    if (attacking) { M.shot = { p, t: simT }; gkReact(1 - tg); }
    return true;
  }

  /* ---------- entradas y faltas ---------- */
  function tackle(p, slide) {
    if (p.one || p.down > 0 || (p.fooled && p.fooled.until > simT)) return;
    const o = M.owner; const poke = !slide && Math.random() < .5; const n = slide ? "SoccerTackle" : poke ? "SoccerTackle2" : "SoccerPass"; const a = Math.atan2(ball.y - p.y, ball.x - p.x);
    const ob = startOne(p, n, slide ? { ts: 1.25, h0: a, turnTo: a, turnT: .1, end: 1.5, fadeIn: .06 } : (poke ? { ts: 1.5, h0: a, turnTo: a, turnT: .2, end: .85, rootScale: 0, fadeIn: .06 } : { ts: 1.7, t0: .15, h0: a, turnTo: a, turnT: .2, end: .75, rootScale: .3, fadeIn: .06 }));
    if (!ob) return; p.h = a; ob.hitDone = false;
    ob.during = oo => { if (oo.hitDone || oo.t < (slide ? .15 : poke ? .22 : .3)) return;
      const fR = footLocal(p, "R"), fL = footLocal(p, "L"), db = Math.min(Math.hypot(ball.x - fR.x, ball.y - fR.y), Math.hypot(ball.x - fL.x, ball.y - fL.y));
      const carrier = o && o.t !== p.t && hasBall(o) ? o : null;
      if (db < (slide ? .7 : .55) && ball.z < .5 && !ball.hold) {
        oo.hitDone = true; const win = Math.random() < (slide ? .7 : .55) + (p.st.def - (carrier ? carrier.st.dri : 60)) * .01 - (carrier && simT - (carrier.skillT || -9) < .6 ? .22 : 0);
        if (win || !carrier) { const k = slide ? 7 : 4, aa = a + (Math.random() - .5) * 1.2; ball.vx = Math.cos(aa) * k; ball.vy = Math.sin(aa) * k; ball.vz = slide ? .5 : 0; M.owner = null; M.last = p; p.dr.loose = .25; if (carrier) carrier.dr.loose = .6; sfx(160, .1, .3, "square"); }
      } else if (carrier && Math.hypot(carrier.x - p.x, carrier.y - p.y) < (slide ? 1.0 : .75)) {
        oo.hitDone = true; const behind = Math.cos(angD(carrier.h, Math.atan2(p.y - carrier.y, p.x - carrier.x))) < -.3;
        if (Math.random() < (slide ? .75 : .45) + (behind ? .2 : 0)) foul(p, carrier, slide && behind); } };
  }
  // el árbitro corre hacia el infractor y le enseña la tarjeta con la mano en alto
  const cardMesh = new THREE.Mesh(new THREE.BoxGeometry(.085, .12, .006), new THREE.MeshBasicMaterial({ color: 0xffd400 })); cardMesh.visible = false;
  const refA = OFF.find(a => a.role === "ref"); if (refA) { const hb = refA.inner.getObjectByName("RightHand"); if (hb) { hb.add(cardMesh); refA.inner.updateMatrixWorld(true); const ws = hb.getWorldScale(new THREE.Vector3()).x || 1; cardMesh.scale.setScalar(1 / ws); cardMesh.position.set(0, .11 / ws, 0); } }
  // brazo en alto (tarjeta): orienta brazo y antebrazo hacia arriba sobre la pose animada
  const _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _v = new THREE.Vector3(), _v2 = new THREE.Vector3();
  function aimBone(b, c, dir) { b.updateMatrixWorld(true); b.getWorldPosition(_v); c.getWorldPosition(_v2); _v2.sub(_v).normalize(); _q.setFromUnitVectors(_v2, dir); b.getWorldQuaternion(_q2); _q2.premultiply(_q); b.parent.getWorldQuaternion(_q); b.quaternion.copy(_q.invert().multiply(_q2)); b.updateMatrixWorld(true); }
  function raiseArm(a) { const A = a.inner.getObjectByName("RightArm"), F = a.inner.getObjectByName("RightForeArm"), H = a.inner.getObjectByName("RightHand"); if (!A || !F || !H) return;
    const up = new THREE.Vector3(Math.cos(-a.h + Math.PI / 2) * 0, 1, 0); const fw = new THREE.Vector3(Math.cos(a.h), 0, Math.sin(a.h)); up.addScaledVector(fw, .25).normalize(); aimBone(A, F, up); aimBone(F, H, up);
    // la tarjeta mira hacia delante (de cara al jugador y a la cámara)
    H.getWorldQuaternion(_q2); _q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.atan2(fw.x, fw.z)); cardMesh.quaternion.copy(_q2.invert().multiply(_q)); }
  function showCard(col, f, red) { play("grada_silba", red ? .5 : .3); if (!refA) return; if (!f.one && !f.gk) startOne(f, "StandingArguing", { t0: 1.5, ts: 1.1, end: 4.6, rootScale: 0, fadeIn: .2, h0: Math.atan2(refA.y - f.y, refA.x - f.x) }); cardMesh.material.color.setHex(col); refA.h = refA.mh = Math.atan2(f.y - refA.y, f.x - refA.x);
    refA.cardT = simT + 2.2; cardMesh.visible = true; later(2.2, () => { cardMesh.visible = false; });
    if (red) { f.sent = true; if (M.lockP === f) { M.lockP = null; M.human = null; M.lockOut = true; } if (M.human === f) { const c = team(f.t).find(q => !q.gk && q !== f); if (c) setHuman(c); } } }
  function knockDown(p, a) { p.down = 2.4; p.dr.plan = null; const o = startOne(p, Math.random() < .5 ? "SoccerTrip" : "FallFlat", { ts: 1.1, h0: a, end: 2.2, fadeIn: .08 }); if (o) o.after = () => { startOne(p, "GettingUp", { ts: 1.5, t0: .4, end: 2.4, rootScale: 0 }); }; }
  function foul(f, v, hard, force) {
    if (DR) return;
    if (M.phase !== "play" || (M.adv && !force)) return;
    const inBox = prog(f.t, v.x) < .158 && Math.abs(v.y - W / 2) < 20.16;
    if (!force) { TEAMS[f.t].stats.fo++; knockDown(v, Math.atan2(v.y - f.y, v.x - f.x));
      // lesión: rara, más probable en entradas duras; el lesionado corre menos hasta que lo cambien
      if (!v.inj && !v.gk && Math.random() < (hard ? .14 : .025)) { v.inj = true; v.st.pac -= 14; v.st.acc -= 14; v.st.agi -= 10; later(2.4, () => msg(v.name + " se ha lesionado" + (v.t === M.humanTeam ? " · haz un cambio (Esc)" : ""), 2.6)); } }
    let card = "", cc = null; const mm = curMin(); M.evH++;
    if (!force) { f.fouls = (f.fouls || 0) + 1;
      // criterio del árbitro: ocasión manifiesta (último hombre, hacia portería) = roja; cortar un contraataque o reincidir = amarilla
      const gx = own(f.t), dG = Math.hypot(v.x - gx, v.y - W / 2), behindF = team(f.t).filter(q => q !== f && !q.sent && prog(f.t, q.x) < prog(f.t, v.x) - .005).length, mates = team(v.t).filter(q => q !== v && !q.gk && prog(v.t, q.x) > prog(v.t, v.x) - .05).length;
      const dogso = dG < 30 && behindF <= 1 && Math.abs(v.y - W / 2) < 22 && !inBox, counter = prog(v.t, v.x) > .4 && mates >= 2 && behindF <= 3;
      if (dogso) cc = "R"; else if (hard && Math.random() < .12) cc = "R"; else if (hard ? Math.random() < .65 : (counter && Math.random() < .55) || f.fouls >= 3 && Math.random() < .5 || Math.random() < .08) cc = "A";
      if (cc === "A" && (f.yel || 0) >= 1) cc = "R2"; if (f.gk && cc && cc !== "A" && !dogso) cc = "A"; if (cc && f.fouls >= 3) f.fouls = 0; M.refWhy = dogso ? "ocasión manifiesta de gol" : counter && cc === "A" ? "cortar el contraataque" : ""; }
    if (cc) { (M.cards = M.cards || []).push({ m: mm, s: f.t, n: f.name, c: cc === "A" ? "A" : "R" }); if (cc === "A") { f.yel = (f.yel || 0) + 1; card = "  ·  AMARILLA para " + f.name; } else card = "  ·  ROJA para " + f.name + (cc === "R2" ? " (segunda amarilla)" : M.refWhy ? " (" + M.refWhy + ")" : ""); }
    const doCard = () => { if (!cc) return; if (refA) refA.goto = { x: clamp(f.x + 1.8, 1, L - 1), y: clamp(f.y + .8, 1, W - 1), until: simT + 3.2 }; later(1.7, () => showCard(cc === "A" ? 0xffd400 : 0xe11d2e, f, cc !== "A")); };
    // ley de la ventaja: si el equipo que recibe la falta sigue con opciones (atacando y con compañeros cerca del balón), el árbitro deja seguir
    if (!force && !inBox && prog(v.t, v.x) > .4 && team(v.t).some(q => q !== v && !q.gk && Math.hypot(q.x - ball.x, q.y - ball.y) < 9) && !(M.owner && M.owner.t === f.t && Math.hypot(ball.x - f.x, ball.y - f.y) < 1.5)) {
      M.adv = { f, v, x: v.x, y: v.y, at: simT, doCard, card }; msg("VENTAJA" + card, 1.6); if (refA) refA.cardT = 0; return; }
    whistle(1); doCard(); M.owner = null;
    if (inBox) later(1.4, () => startSet("pen", v.t, own(f.t) === 0 ? 11 : L - 11, W / 2)), msg("¡PENALTI!" + card, 2.5);
    else later(1.3, () => startSet("fk", v.t, v.x, v.y)), msg("FALTA de " + f.name + card, 2.2);
    M.phase = "stop";
  }
  // tras dar ventaja: si a los 2 s el equipo sigue con el balón, se sigue; si lo pierde enseguida, se vuelve a la falta. La tarjeta se enseña en la siguiente parada
  function advStep() { const A = M.adv; if (!A) return;
    if (M.phase !== "play") { A.doCard(); M.adv = null; return; }
    const el = simT - A.at, o = M.owner;
    if (el > .5 && el < 2.2 && o && o.t === A.f.t) { M.adv = null; whistle(1); M.owner = null; M.phase = "stop"; msg("FALTA de " + A.f.name + A.card, 2); A.doCard(); later(1.3, () => startSet("fk", A.v.t, A.x, A.y)); return; }
    if (el >= 2.2) { M.adv = null; if (A.card) M.pendCard = A.doCard; } }
  function callOffside(p) { if (M.phase !== "play" || DR) return; TEAMS[p.t].stats.off++; whistle(1); msg("FUERA DE JUEGO · " + p.name, 2); M.phase = "stop"; M.pass = null; const at = p.offAt || p; later(1.3, () => startSet("fk", 1 - p.t, at.x, at.y, true)); }

  /* ---------- humano: control del jugador y cambio ---------- */
  function setHuman(p) { if (M.lockOut || (M.lockP && p !== M.lockP)) return; if (M.human === p) return; M.human = p; if (p) p.req = null; }   // modo carrera de jugador: solo controlas a tu futbolista
  function nearestTo(t, x, y, excl) { let b = null, bd = 1e9; for (const p of team(t)) { if (p.gk || p === excl) continue; const d = Math.hypot(p.x - x, p.y - y); if (d < bd) { bd = d; b = p; } } return b; }
  let charge = null, lastI = { dir: null };
  function humanControl(I, dt) {
    const p = M.human; if (!p) return { dir: null, m: 0 };
    if (I.swD && !hasBall(p)) { const pb = predictBall(.5); const c = team(M.humanTeam).filter(q => !q.gk && q !== p).sort((a, b) => Math.hypot(a.x - pb.x, a.y - pb.y) - Math.hypot(b.x - pb.x, b.y - pb.y))[0]; if (c) setHuman(c); }
    if (M.phase === "set") return { dir: null, m: 0 };
    // golpeos con barra de potencia (pase, tiro, centro, al hueco)
    // regates: ruleta (R / stick derecho) y frenar el balón con la suela (T / stick izquierdo)
    if (I.ctx && M.owner && M.owner.t !== p.t) I.walk = true;   // REGATE defendiendo = contener
    if (hasBall(p) && !p.one && !charge && I.ctxD) { skillMove(p, ctxSkill(p, I), I); return { dir: null, m: 0 }; }
    if (hasBall(p) && !p.one && !charge && I.rskD && I.rs != null) { const J = { dir: I.rs, m: 1, spr: I.spr }; skillMove(p, ctxSkill(p, J), J); return { dir: null, m: 0 }; }
    if (hasBall(p) && !p.one && !charge && (I.spinD || I.stopD || I.feintD || I.nutD || I.stepD)) { skillMove(p, I.spinD ? "spin" : I.stopD ? "stop" : I.feintD ? "feint" : I.nutD ? "nut" : "step", I); return { dir: null, m: 0 }; }
    const keys = { shot: I.shoot, pass: I.pass, lob: I.lob, thru: I.thru };
    if (hasBall(p) || (!M.owner && Math.hypot(ball.x - p.x, ball.y - p.y) < 2.2 && ball.z < .6)) {
      if (!charge) {
        // DLS: pase, al hueco y bombeado salen al pulsar, con la fuerza justa según la distancia
        const pk = I.passD ? "pass" : I.thruD ? "thru" : I.lobD ? "lob" : null;
        if (pk) { humanKick(p, { k: pk, p: .6, inst: true }, I); }
        else if (I.shootD) charge = { k: "shot", p: 0 }; }
      else { if (I.fin) charge.fin = true; charge.p = Math.min(1, charge.p + dt / (charge.k === "pass" ? .9 : 1.05)); if (!keys[charge.k]) { humanKick(p, charge, I); charge = null; } }
    } else {
      charge = null;
      if (M.pass && M.pass.to === p && M.pass.t === p.t && (I.passD || I.thruD || I.lobD || I.shootD)) { p.oneTouch = { k: I.shootD ? "shot" : I.lobD ? "lob" : I.thruD ? "thru" : "pass", at: simT }; msg("¡DE PRIMERAS!", .6); }   // pase o tiro al primer toque
      if (M.owner && M.owner.t === p.t && M.owner !== p && !M.owner.gk && (I.passD || I.thruD || I.lobD)) { M.call = { k: I.thruD ? "thru" : I.lobD ? "lob" : "pass", at: simT, p }; msg(I.thruD ? "¡AL HUECO!" : "¡DÁMELA!", .7); }
      // balón por alto: pulsar antes de que llegue deja preparado el cabezazo (tiro o pase), como en FIFA
      if (ball.z > .5 && !ball.hold && (I.shootD || I.passD || I.lobD)) p.hdrBuf = { cmd: I.shootD ? "shot" : "pass", at: simT };
      // defensa como en DLS: PASE = cambiar de jugador · HUECO (o PASE mantenido) = presionar · TIRO = entrada (segada si vas lanzado) · CENTRO = segada
      const defd = M.owner && M.owner.t !== p.t && !M.owner.gk;
      if (defd && I.passD && simT - (M.swT || 0) > .25) { const pb = predictBall(.35), d0 = Math.hypot(p.x - pb.x, p.y - pb.y), c = team(p.t).filter(q => !q.gk && q !== p && !q.sent && q.down <= 0).sort((a, b) => Math.hypot(a.x - pb.x, a.y - pb.y) - Math.hypot(b.x - pb.x, b.y - pb.y))[0];
        if (c && Math.hypot(c.x - pb.x, c.y - pb.y) < d0 - .8) { setHuman(c); M.swT = simT; return { dir: null, m: 0 }; } }
      if (I.shootD && defd) { const d = dist(p, M.owner); if (d < 2.2) tackle(p, false); else if (d < 4.2 && p.v > 3.2) tackle(p, true); }
      if (I.lobD && defd && dist(p, M.owner) < 4) tackle(p, true);
      if ((I.thru || (I.pass && !I.passD)) && defd) { const o = M.owner, gx = own(p.t), tx = lerp(o.x, gx, .1), ty = lerp(o.y, W / 2, .1); const d = Math.hypot(tx - p.x, ty - p.y); return { dir: Math.atan2(ty - p.y, tx - p.x), m: d > .9 ? 1 : 0, spr: I.spr || d > 6, face: d < 4 ? Math.atan2(o.y - p.y, o.x - p.x) : null }; }
    }
    $("#pw").style.display = charge ? "block" : "none"; if (charge) { $("#pw i").style.width = (charge.p * 100) + "%"; $("#pw").classList.toggle("shot", charge.k === "shot"); }
    // C / LT: sin balón = temporizar (encarado al rival, pasos laterales); con balón = cubrir el balón de espaldas al rival
    if (I.walk && M.phase === "play") { const o = M.owner;
      if (o && o.t !== p.t) { p.jockey = simT; return { dir: I.dir, m: Math.min(I.m, .55), spr: false, face: Math.atan2(o.y - p.y, o.x - p.x), speed: I.m > .05 ? 2.6 : 0 }; }
      if (hasBall(p)) { const opp = team(1 - p.t).filter(q => !q.gk).sort((a, b) => dist(a, p) - dist(b, p))[0]; if (opp && dist(opp, p) < 4) { p.shield = simT; return { dir: I.dir, m: Math.min(I.m, .4), spr: false, face: Math.atan2(p.y - opp.y, p.x - opp.x), speed: I.m > .05 ? 1.5 : 0 }; } } }
    return { dir: I.dir, m: I.m, spr: I.spr };
  }
  // pase asistido como en FIFA: elige al compañero en la dirección del stick
  function assistTarget(p, dirH, k, stick) {
    const maxD = k === "lob" ? 65 : k === "thru" ? 50 : 42;
    const pickIn = cone => { let b = null, bs = -1e9; for (const q of team(p.t)) { if (q === p || q.down > 0 || q.sent) continue; const dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy); if (d < 2.5 || d > maxD) continue;
        const ang = Math.abs(angD(dirH, Math.atan2(dy, dx))); if (ang > cone) continue; const risk = k === "lob" ? 0 : passRisk(p, q.x + Math.cos(q.mh) * q.v * .4, q.y + Math.sin(q.mh) * q.v * .4), op = Math.min(6, openness(q, p.t));
        const sc = -ang * (stick ? 15 : 4) - risk * (stick ? 1.1 : 3.2) + op * (stick ? .25 : .5) - Math.abs(d - (k === "lob" ? 28 : 15)) * (stick ? .03 : .06) + (prog(p.t, q.x) - prog(p.t, p.x)) * (stick ? 1.5 : 8) - (q.gk ? 3 : 0);
        if (sc > bs) { bs = sc; b = q; } } return b; };
    return pickIn(stick ? .7 : 1.1) || pickIn(1.25) || (stick ? null : pickIn(3.2));
  }
  function humanKick(p, c, I) {
    const dirH = I.dir != null ? I.dir : p.h, t = p.t;
    if (c.k === "shot") { const side = I.dir != null && Math.abs(I.my) > .25 ? Math.sign(I.my) : (ball.y < W / 2 ? 1 : -1); const pow = !!I.spr && !c.fin && c.p >= .5;
      // vaselina: centro (L / X) mantenido al tirar, o tiro flojo con el portero adelantado
      const g = GKP(1 - t), gOff = Math.abs(g.x - own(1 - t)), dG = Math.hypot(opp(t) - ball.x, W / 2 - ball.y);
      if ((I.lob || (c.p < .3 && gOff > 4)) && dG > 7 && dG < 32) { requestKick(p, { k: "shot", chip: true, p: .5, tx: opp(t) + M.dirOf[t] * .2, ty: W / 2 + side * 1.2, tz: 1.7 }); return; }
      const perf = c.p >= .63 && c.p <= .73;   // punto dulce de la barra: tiro perfecto
      requestKick(p, { k: "shot", p: Math.max(.12, c.p), fin: c.fin, pow, perf, tx: opp(t) + M.dirOf[t] * .2, ty: W / 2 + side * (GW / 2 - (c.fin ? .4 : pow ? .7 : .5)), tz: pow ? .35 + c.p * .9 : undefined }); return; }
    let k = c.k;
    if (k === "pass" || k === "thru") {   // desde la banda en el último tercio hacia el área: centro
      const wide = prog(t, p.x) > .7 && Math.abs(p.y - W / 2) > 14, q = wide ? assistTarget(p, dirH, "lob", I.dir != null) : null;
      if (q && inArea(1 - t, q.x, q.y, 3)) { passTo(p, q, "cross", .7 + c.p * .25); return; }
      if (c.p > .82 && !c.inst) k = k === "pass" ? "lob" : "thrulob"; }   // botón mantenido: en largo / al hueco por alto
    if (k === "thrulob") { const q = assistTarget(p, dirH, "thru", I.dir != null); if (q) { const sp = thruSpot(p, q) || { x: q.x + M.dirOf[t] * 6, y: q.y }; requestKick(p, { k: "cross", p: .7, to: q, tx: clamp(sp.x, 1, L - 1), ty: clamp(sp.y, 1, W - 1), tz: .6 }); q.ai.recv = { at: simT, x: sp.x, y: sp.y }; return; } k = "lob"; }
    const mate = assistTarget(p, dirH, k, I.dir != null);
    if (!mate) { const D = k === "lob" ? 15 + c.p * 30 : 8 + c.p * 30; requestKick(p, { k: k === "lob" ? "lob" : "pass", p: c.p, soft: true, tx: p.x + Math.cos(dirH) * D, ty: p.y + Math.sin(dirH) * D }); return; }
    passTo(p, mate, k, c.p);
  }
  const nearestDef = p => team(1 - p.t).filter(q => !q.gk && q.down <= 0).sort((a, b) => dist(a, p) - dist(b, p))[0];
  // botón REGATE (como en DLS): el regate depende de hacia dónde empujas el stick respecto a donde miras
  function ctxSkill(p, I) {
    const d0 = nearestDef(p), close = d0 && dist(d0, p) < 3.5 && Math.abs(angD(p.h, Math.atan2(d0.y - p.y, d0.x - p.x))) < .9;
    if (I.dir == null || I.m < .3) return close ? "hat" : "stop";
    const rel = Math.abs(angD(p.h, I.dir));
    if (rel < .5) return "nut";
    if (rel < 1.05) return "step";
    if (rel > 2.3) return "spin";
    return I.spr ? "feint" : "croq"; }
  // ¿se come el amago? como en DLS cuenta el momento: si el defensa viene lanzado hacia ti y está a 1-3 m, pica casi siempre
  function foolChance(p, d0, base) { const d = dist(d0, p), toMe = Math.atan2(p.y - d0.y, p.x - d0.x), closing = (d0.v || 0) * Math.cos(angD(d0.h, toMe));
    const timing = d > .9 && d < 3.2 ? .12 + clamp(closing / 6, 0, .2) : d < .9 ? -.15 : -.1;
    return clamp(base + timing + (p.st.dri - d0.st.def) * .012, .15, .92); }
  function fool(d0, x, y, t) { d0.fooled = { until: simT + t, x, y }; d0.v = Math.min(d0.v || 0, 1.2);
    if (!d0.one && META.JoggingStumble && Math.random() < .55) startOne(d0, "JoggingStumble", { ts: 1.5, end: Math.min(1.1, t + .2), rootScale: .4, h0: d0.h, fadeIn: .08 }); }
  function skillMove(p, kind, I) {
    const outH = I.dir != null ? I.dir : p.h; p.skillT = simT;
    if (p === M.human && !window.STEP) { const NM = { spin: "RULETA", feint: "AMAGO", step: "BICICLETA", croq: "CROQUETA", hat: "SOMBRERO", stop: "FRENO", nut: nearestDef(p) && dist(nearestDef(p), p) < 3 ? "CAÑO" : "AUTOPASE" }; if (NM[kind] && !/CAÑO|SOMBRERO/.test(NM[kind])) msg(NM[kind], .55); }   // el nombre del regate, para aprender a hacerlos
    if (kind === "spin") { // ruleta: el balón va pegado al pie mientras gira, sale en la dirección del stick
      const o = startOne(p, "SoccerSpin", { ts: 1.25, h0: p.h, fadeIn: .08, end: 1.15 }); if (!o) return; p.dr.plan = null; p.skillT = simT;
      o.during = oo => { const k = oo.t / 1.15, a = p.h + k * .6; ball.x = lerp(ball.x, p.x + Math.cos(a) * .38, .5); ball.y = lerp(ball.y, p.y + Math.sin(a) * .38, .5); ball.vx = Math.cos(p.h) * p.v; ball.vy = Math.sin(p.h) * p.v; ball.z = 0; M.owner = p; };
      o.after = () => { p.h = p.mh = outH; ball.vx = Math.cos(outH) * 3.8; ball.vy = Math.sin(outH) * 3.8; p.v = Math.max(p.v, 3.4); M.owner = p; }; touchSfx(4);
      { const d0 = nearestDef(p); if (d0 && dist(d0, p) < 3.5 && Math.random() < foolChance(p, d0, .5)) fool(d0, d0.x + Math.cos(p.h) * 1.5, d0.y + Math.sin(p.h) * 1.5, 1.0); } }
    else if (kind === "feint" || kind === "step") { // amago / bicicleta (como en DLS): el cuerpo engaña hacia un lado y sales hacia donde marcaste con el stick
      const d0 = nearestDef(p), side = I.dir != null ? (angD(p.h, I.dir) >= 0 ? 1 : -1) : (d0 ? (angD(p.h, Math.atan2(d0.y - p.y, d0.x - p.x)) >= 0 ? -1 : 1) : 1);
      const fakeN = side > 0 ? "SprintForwardRight" : "SprintForwardLeft", dur = kind === "step" ? .42 : .26;
      p.leanT = { v: side * .3 * (kind === "step" ? 1.2 : 1), until: simT + dur * .55 };   // el cuerpo se inclina hacia el lado del engaño
      if (kind === "step") later(dur * .5, () => { p.leanT = { v: -side * .32, until: simT + dur * .45 }; });   // bicicleta: cambia de lado a mitad
      const o = startOne(p, META[fakeN] ? fakeN : (side > 0 ? "JogStrafeRight" : "JogStrafeLeft"), { ts: kind === "step" ? 1.15 : 1.5, end: dur, rootScale: .35, h0: p.h, fadeIn: .05 });
      if (o) { o.during = () => { ball.x = lerp(ball.x, p.x + Math.cos(p.h) * .45, .45); ball.y = lerp(ball.y, p.y + Math.sin(p.h) * .45, .45); ball.vx = Math.cos(p.h) * p.v * .6; ball.vy = Math.sin(p.h) * p.v * .6; M.owner = p; };
        o.after = () => { const out = p.h + side * .8; ball.vx = Math.cos(out) * 5; ball.vy = Math.sin(out) * 5; p.h = p.mh = out; p.v = Math.max(p.v, 4.4); M.owner = p; p.leanT = { v: -side * .25, until: simT + .3 }; }; }
      if (d0 && dist(d0, p) < 4.5 && Math.random() < foolChance(p, d0, kind === "step" ? .58 : .52)) fool(d0, p.x + Math.cos(p.h - side * 1.2) * 3, p.y + Math.sin(p.h - side * 1.2) * 3, .85);
      touchSfx(2); }
    else if (kind === "nut") { // caño: si hay un rival delante, el balón pasa entre sus piernas; si no, conducción larga a la carrera
      const d0 = nearestDef(p), front = d0 && dist(d0, p) < 3 && Math.abs(angD(p.h, Math.atan2(d0.y - p.y, d0.x - p.x))) < .55;
      if (front) { const ok = Math.random() < foolChance(p, d0, .42), a = Math.atan2(d0.y - ball.y, d0.x - ball.x);
        if (ok) { const tx = d0.x + Math.cos(a) * 2.6, ty = d0.y + Math.sin(a) * 2.6, D = Math.hypot(tx - ball.x, ty - ball.y), v0 = rollV0(D, .7); ball.vx = Math.cos(a) * v0; ball.vy = Math.sin(a) * v0; d0.nutT = simT + .9; fool(d0, d0.x - Math.cos(a) * 1.5, d0.y - Math.sin(a) * 1.5, .95); p.dr.plan = null; M.owner = p; p.dr.loose = 0; msg("¡CAÑO!", 1.1); crowdOoh(.8); M.crowdEx = Math.max(M.crowdEx || 0, .4); }
        else { ball.vx = Math.cos(a) * 5; ball.vy = Math.sin(a) * 5; p.dr.loose = .5; M.owner = null; } }
      else { const a = I.dir != null ? I.dir : p.h, v0 = 7.2; ball.vx = Math.cos(a) * v0; ball.vy = Math.sin(a) * v0; p.dr.plan = null; p.dr.loose = .12; p.h = p.mh = a; p.v = Math.max(p.v, 5.5); }   // pase largo a sí mismo: arrancada
      kickSnd(6); }
    else if (kind === "croq") { // croqueta: el balón pasa de un pie a otro hacia un lado, rápido; el defensa que está delante puede quedarse clavado
      const d0 = nearestDef(p), side = I.dir != null ? (angD(p.h, I.dir) >= 0 ? 1 : -1) : 1, out = p.h + side * 1.15;
      const cn = side > 0 ? "RunLeft" : "RunRight", o = startOne(p, META[cn] ? cn : (side > 0 ? "JogStrafeLeft" : "JogStrafeRight"), { ts: 1.7, end: .36, rootScale: .75, h0: p.h, fadeIn: .05 }); p.skillT = simT; p.leanT = { v: -side * .22, until: simT + .3 };
      if (o) { o.during = () => { ball.x = lerp(ball.x, p.x + Math.cos(out) * .42, .55); ball.y = lerp(ball.y, p.y + Math.sin(out) * .42, .55); ball.vx = Math.cos(out) * Math.max(1.5, p.v * .8); ball.vy = Math.sin(out) * Math.max(1.5, p.v * .8); M.owner = p; };
        o.after = () => { const go = p.h + side * .55; ball.vx = Math.cos(go) * 4.2; ball.vy = Math.sin(go) * 4.2; p.h = p.mh = go; p.v = Math.max(p.v, 3.4); }; }
      if (d0 && dist(d0, p) < 4 && Math.random() < foolChance(p, d0, .55)) fool(d0, p.x - Math.sin(p.h) * side * 2.5, p.y + Math.cos(p.h) * side * 2.5, .8);
      touchSfx(3); }
    else if (kind === "hat") { // sombrero: el balón sale por encima del rival y lo recoges detrás
      const d0 = nearestDef(p), a = p.h, ok = !d0 || Math.random() < foolChance(p, d0, .5);
      ball.vx = Math.cos(a) * 3.6; ball.vy = Math.sin(a) * 3.6; ball.vz = ok ? 4.4 : 2.2; ball.z = Math.max(ball.z, .1); M.owner = null; p.dr.plan = null; p.dr.loose = .15; p.skillT = simT;
      if (META.Chip) startOne(p, "Chip", { ts: 1.7, t0: Math.max(0, META.Chip.kick.t - .18), end: META.Chip.kick.t + .25, rootScale: 0, h0: a, fadeIn: .05 });
      if (d0 && dist(d0, p) < 4.5) { if (ok) { fool(d0, d0.x - Math.cos(a) * 1.2, d0.y - Math.sin(a) * 1.2, .95); msg("¡SOMBRERO!", 1); crowdOoh(.9); M.crowdEx = Math.max(M.crowdEx || 0, .4); } }
      later(.12, () => { p.v = Math.max(p.v, 4.5); }); kickSnd(5); }
    else { // frenar: la suela para el balón y el jugador se clava
      p.v = Math.min(p.v, 1); ball.vx = ball.vy = 0; ball.x = p.x + Math.cos(p.h) * .3; ball.y = p.y + Math.sin(p.h) * .3; p.dr.plan = null; touchSfx(3);
      { const d0 = nearestDef(p); if (d0 && dist(d0, p) < 3.2 && (d0.v || 0) > 3 && Math.random() < foolChance(p, d0, .45)) fool(d0, d0.x + Math.cos(d0.h) * 2.5, d0.y + Math.sin(d0.h) * 2.5, .7); }   // el que venía lanzado se pasa de largo
      startOne(p, "StallSoccerball", { ts: 1.6, t0: .1, end: .75, rootScale: 0, fadeIn: .08, h0: p.h }); }
  }
  // regate de la máquina con cabeza: mira dónde está el defensa y hacia qué lado hay sitio
  function aiSkill(p, d0) { if (simT - (p.skillT || -9) < 2) return null; const toD = Math.atan2(d0.y - p.y, d0.x - p.x), rel = angD(p.h, toD), dd = dist(d0, p);
    if (Math.abs(rel) > 1.4) return null;   // el defensa va por detrás o al lado: mejor correr
    let sd = rel > 0 ? -1 : 1; const ny = p.y + Math.sin(p.h + sd * 1.2) * 4; if (ny < 2.5 || ny > W - 2.5) sd = -sd;   // hacia el lado con sitio (y lejos de la banda)
    { const o2 = team(1 - p.t).find(q => q !== d0 && !q.gk && dist(q, p) < 5 && Math.sign(angD(p.h, Math.atan2(q.y - p.y, q.x - p.x))) === sd); if (o2 && Math.random() < .7) sd = -sd; }
    const dirS = p.h + sd * 1.15, r = Math.random(), top = p.st.dri >= 84;
    if (Math.abs(rel) < .5) { if (dd < 1.6 && top && r < .2) return { k: "nut", dir: p.h }; if (dd < 2.2 && top && r < .28) return { k: "hat", dir: p.h }; if (r < .55) return { k: "croq", dir: dirS }; if (r < .85) return { k: "feint", dir: dirS }; return { k: "step", dir: dirS }; }
    if (r < .5) return { k: "croq", dir: dirS }; if (r < .75 && p.v > 4) return { k: "nut", dir: p.h + sd * .3 }; return { k: "spin", dir: p.h + sd * 1.5 }; }
  function mateInDir(p, dirH, maxD) { let b = null, bs = -1e9; for (const q of team(p.t)) { if (q === p || q.down > 0) continue; const dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy); if (d < 3 || d > maxD) continue; const ang = Math.abs(angD(dirH, Math.atan2(dy, dx))); if (ang > .75) continue; const s = -ang * 22 - d * .35; if (s > bs) { bs = s; b = q; } } return b; }
  function passTo(p, q, k, pw = .55) {
    // destino: delante del compañero si corre (al hueco: más adelante, al espacio)
    const D0 = Math.hypot(q.x - p.x, q.y - p.y), Ta = k === "thru" ? 1.2 + q.v * .55 : k === "lob" || k === "cross" ? .55 + D0 * .033 : clamp(D0 / 19, .3, 2) * .85;   // tiempo que tarda en llegar
    const run = q.v > 2.5 && !(q === M.human && (!lastI.dir || lastI.m < .35)) ? q.v : q.v * .4, lead = k === "thru" ? Ta : Ta * .9;
    let tx = q.x + Math.cos(q.mh) * run * lead, ty = q.y + Math.sin(q.mh) * run * lead;
    if (k === "thru") { const sp = thruSpot(p, q); if (sp) { tx = sp.x; ty = sp.y; } else { tx += M.dirOf[p.t] * 3; } }
    tx = clamp(tx, 1, L - 1); ty = clamp(ty, 1, W - 1);
    requestKick(p, { k: k === "lob" ? "cross" : k, p: pw, to: q, tx, ty, tz: k === "lob" || k === "cross" ? (prog(p.t, tx) > .8 ? 1.7 : .8) : 0 });
    q.ai.recv = { at: simT, x: tx, y: ty };
    // pared: el que pasa (máquina) sigue la jugada y se desmarca hacia delante para recibir la devolución
    if (p !== M.human && !p.gk && k === "pass" && D0 < 16 && prog(p.t, p.x) > .35 && p.cat !== "def" && Math.random() < .55) { const sd = Math.sign(q.y - p.y) || 1, ax = fx(p.t, Math.min(.94, prog(p.t, q.x) + .1)), ay = clamp(q.y + sd * 5, 4, W - 4); p.ai.run = { x: ax, y: ay, until: simT + 1.9, wall: q }; p.ai.wallT = simT; }
  }

  // pase al hueco: busca el punto delante del desmarque al que llega antes el compañero que cualquier rival
  function thruSpot(p, q) {
    const run = q.ai.run, dirH = run ? Math.atan2(run.y - q.y, run.x - q.x) : (M.dirOf[p.t] > 0 ? 0 : Math.PI), vq = vSpr(q) * .9;
    let best = null, bs = -1e9;
    for (let d = 3; d <= 18; d += 1.5) { const x = q.x + Math.cos(dirH) * d, y = q.y + Math.sin(dirH) * d; if (x < 1 || x > L - 1 || y < 1 || y > W - 1) continue;
      const D = Math.hypot(x - ball.x, y - ball.y), tb = D / 15, tq = d / vq + .2; let to = 99; for (const o of team(1 - p.t)) to = Math.min(to, Math.hypot(o.x - x, o.y - y) / (vSpr(o) * .9) + (o.gk ? .3 : .15));
      if (tq > tb + .6) continue; const s = (to - Math.max(tq, tb)) * 3 + prog(p.t, x) * 6; if (to > Math.max(tq, tb) + .25 && s > bs) { bs = s; best = { x, y }; } }
    return best;
  }
  /* ---------- IA ---------- */
  const openness = (q, t) => { let m = 99; for (const o of team(1 - t)) m = Math.min(m, Math.hypot(o.x - q.x, o.y - q.y)); return m; };
  function laneRisk(a, bx, by, t) { let r = 0; const dx = bx - a.x, dy = by - a.y, L2 = dx * dx + dy * dy || 1; for (const o of team(1 - t)) { const u = clamp(((o.x - a.x) * dx + (o.y - a.y) * dy) / L2, 0, 1), px = a.x + dx * u, py = a.y + dy * u, d = Math.hypot(o.x - px, o.y - py); if (d < 2.2) r += (2.2 - d) * (o.gk ? .5 : 1); } return r; }
  // riesgo real de un pase raso: ¿llega algún rival a la línea antes que el balón?
  function passRisk(p, tx, ty) {
    const D = Math.hypot(tx - p.x, ty - p.y), v0 = clamp(rollV0(D, clamp(D / 16, .35, 3)), 6, 31); let r = 0;
    for (let s2 = .8; s2 < D; s2 += 1.2) { const u = s2 / D, x = p.x + (tx - p.x) * u, y = p.y + (ty - p.y) * u, tb = rollTime(v0, s2) + .25;
      for (const o of team(1 - p.t)) { const to = Math.hypot(o.x - x, o.y - y) / (vSpr(o) * .9) + .3; if (to < tb) r += (tb - to) * (o.gk ? .5 : 1.4); } }
    return r;
  }
  function bestMate(p, maxD) { let b = null, bs = -1e9; for (const q of team(p.t)) { if (q === p || q.gk) continue; const d = dist(p, q); if (d > maxD || d < 4) continue; const s = openness(q, p.t) * 2 - laneRisk(p, q.x, q.y, p.t) * 4 + (prog(p.t, q.x) - prog(p.t, p.x)) * 30; if (s > bs) { bs = s; b = q; } } return b; }
  function homePos(p) {
    const t = p.t, att = M.owner ? M.owner.t === t : (M.last && M.last.t === t), bd = prog(t, ball.x), b = p.base;
    const bw = M.dirOf[t] > 0 ? b.w : 1 - b.w; let d = (p.cat === "def" && !att ? .17 : b.d) * .55 + bd * .45 + (att ? .08 : -.08), wide = Math.abs(bw - .5) > .3, w = lerp(bw, ball.y / W, att ? (wide ? .08 : .2) : (p.cat === "fwd" ? .2 : .38));   // defensa en línea al defender (trampa del fuera de juego)
    if (p.cat === "def") d = Math.min(d, att ? .55 : bd + .02, .62);   // defensa: no por delante del balón al defender
    if (p.cat === "fwd") d = Math.max(d, att ? .58 : .4); if (att && p.cat === "mid") d = Math.max(d, bd - .05);
    // línea defensiva: no por detrás del área si el balón está lejos
    if (p.cat === "def" && bd > .45) d = Math.max(d, .18);
    if (!att && !p.gk) {   // bloque: tres líneas juntas (unos 12-14 m entre líneas) que bascula hacia el lado del balón
      const dl = clamp(bd - (STREET ? .2 : .25), .07, .48); d = p.cat === "def" ? dl : p.cat === "mid" ? dl + (STREET ? .15 : .135) : dl + (STREET ? .3 : .28);
      w = clamp(ball.y / W + (bw - .5) * (p.cat === "fwd" ? .75 : p.cat === "mid" ? .55 : .6), .05, .95); w = lerp(w, .5, bd < .3 ? .18 : .06); }
    else if (att && !p.gk && (p.role === "EI" || p.role === "ED" || p.role === "MI" || p.role === "MD")) w = bw < .5 ? .07 : .93;   // atacando: extremos abiertos para dar amplitud
    const mt = TEAMS[t].ment || 0; if (!p.gk) d += mt === 2 ? (att ? .03 : .07) : mt * .045;   // táctica: defensiva -1, equilibrada 0, ofensiva 1, presión alta 2
    return { x: fx(t, clamp(d, .05, .93)), y: clamp(w * W, 3, W - 3) };
  }
  function aiPlayer(p, dt) {
    const t = p.t, C = { dir: null, m: 0, spr: false };
    if (p.gk || p.down > 0 || p.one) return C;
    if (DR) return drAI(p, dt, C);
    const goTo = (x, y, spr, face, slow) => { const d = Math.hypot(x - p.x, y - p.y); if (d < (p.v < .5 ? 1.1 : .6)) { C.m = 0; if (face != null) C.face = face; return; } C.dir = Math.atan2(y - p.y, x - p.x); C.m = d < 2.5 ? .5 : d < 6 && !spr ? .7 : 1; C.spr = spr && d > 4; if (slow) C.m = Math.min(C.m, .62); if (face != null) C.face = face; };
    const owner = M.owner, mineBall = owner && owner.t === t, loose = !owner;
    { const og = GKP(1 - t), gm = gkS[1 - t] && gkS[1 - t].mode; if (ball.hold === og || gm === "hold" || gm === "throw") { const gx = own(1 - t), dx = Math.abs(p.x - gx);
        if (dx < 19 && Math.abs(p.y - W / 2) < 23) { goTo(gx + M.dirOf[1 - t] * 21, clamp(p.y, 6, W - 6), true); return C; } } }
    // con el balón
    if (owner === p) return carrierAI(p, dt, C);
    // balón suelto: el más rápido de cada equipo va a por él
    if (loose && !ball.hold) {
      const ch = chaser(t); if (ch === p) { const ip = interceptPt(p); goTo(ip.x, ip.y, true); return C; }
    }
    // recibiendo un pase: ir al punto de llegada
    if (p.ai.recv && simT - p.ai.recv.at < 3 && M.pass && M.pass.to === p) { const ip = M.pass.k === "cross" || M.pass.k === "lob" ? headerPt(p) : interceptPt(p); goTo(ip.x, ip.y, true, null); return C; }
    // en un centro rival, el defensa más cercano al punto de remate va a disputarlo
    // defensa ante un centro: tarda en leer la trayectoria (según su defensa) y calcula con error; el primero va al balón, el segundo cubre detrás
    if (M.pass && (M.pass.k === "cross") && M.pass.t !== t && M.pass.to && p.cat !== "fwd") { const hp = headerPt(M.pass.to); const cl = team(t).filter(q => !q.gk && q.down <= 0).sort((a, b) => Math.hypot(a.x - hp.x, a.y - hp.y) - Math.hypot(b.x - hp.x, b.y - hp.y));
      if (cl[0] === p || cl[1] === p) { const react = .3 + (100 - p.st.def) * .008; if (simT - M.pass.at < react) { goTo(p.x, p.y, false); return C; }
        const er = M.pass.err || (M.pass.err = {}), e = er[p.i] || (er[p.i] = { x: (Math.random() - .5) * (2.6 - p.st.def * .018), y: (Math.random() - .5) * (2.6 - p.st.def * .018) });
        goTo(hp.x + e.x - M.dirOf[1 - t] * (cl[0] === p ? .3 : 1.6), hp.y + e.y, true); return C; } }
    if (mineBall) { // apoyo y desmarques
      const h = homePos(p);
      if (p.ai.run && simT < p.ai.run.until) { goTo(p.ai.run.x, p.ai.run.y, true); return C; } else p.ai.run = null;
      if (p.cat === "fwd" && Math.random() < dt * (owner === M.human ? .45 : .34) && prog(t, owner.x) > .3) {          // delantero: desmarque al espacio, saliendo desde la línea
        const line = lastLine(t); p.ai.run = { x: fx(t, Math.min(.96, line + .09)), y: clamp(p.y + (Math.random() - .5) * 10, 6, W - 6), until: simT + 2.2 };
      }
      if (p.fb && prog(t, owner.x) > .55 && Math.abs(owner.y - p.y) < 22 && Math.random() < dt * .15) p.ai.run = { x: fx(t, Math.min(.88, prog(t, owner.x) + .12)), y: (M.dirOf[t] > 0 ? p.base.w : 1 - p.base.w) < .5 ? 4 : W - 4, until: simT + 2.5 };
      // delantero que baja a recibir cuando el compañero está apurado en su campo
      if (p.cat === "fwd" && !p.ai.run && prog(t, owner.x) < .45 && Math.random() < dt * .35) { const pz = team(1 - t).some(o => dist(o, owner) < 3.5); if (pz) p.ai.run = { x: fx(t, clamp(prog(t, owner.x) + .16, .3, .7)), y: clamp(lerp(p.y, owner.y, .4), 5, W - 5), until: simT + 1.6 }; }
      // llegada desde segunda línea: un medio pisa el área cuando el balón está en el último tercio
      if (p.cat === "mid" && !p.ai.run && prog(t, owner.x) > .62 && Math.random() < dt * .12 && !team(t).some(q => q !== p && q.ai.run && q.cat === "mid")) p.ai.run = { x: fx(t, .86), y: clamp(W / 2 + (Math.random() - .5) * 14, 8, W - 8), until: simT + 2.4 };
      // ofrecerse: los dos más cercanos al poseedor forman un triángulo con línea de pase libre; el resto mantiene su sitio
      let tx = h.x, ty = h.y;
      const sup = team(t).filter(q => !q.gk && q !== owner && q.down <= 0 && !q.ai.run && !(M.lockP && q === M.lockP)).sort((a, b) => dist(a, owner) - dist(b, owner)).slice(0, 2);
      if (sup.includes(p)) { const S0 = p.ai.sup; if (!S0 || simT > S0.until || dist(owner, S0) > (STREET ? 11 : 20)) {
          const fwdA = M.dirOf[t] > 0 ? 0 : Math.PI, R = STREET ? 6.5 : 11.5, other = sup.find(q => q !== p), oS = other && other.ai.sup; let best = null, bs = -1e9;
          for (const da of [-1.05, -.55, .55, 1.05, 1.75, -1.75, 2.5, -2.5]) { const a = fwdA + da, x = clamp(owner.x + Math.cos(a) * R, 2, L - 2), y = clamp(owner.y + Math.sin(a) * R, 2, W - 2);
            const sc = Math.min(6, openness({ x, y }, t)) * .8 - passRisk(owner, x, y) * 2.5 + Math.cos(da) * .9 - Math.hypot(x - p.x, y - p.y) * .08 - (oS && Math.hypot(x - oS.x, y - oS.y) < R * .8 ? 4 : 0);
            if (sc > bs) { bs = sc; best = { x, y }; } }
          p.ai.sup = best ? { x: best.x, y: best.y, until: simT + .7 } : null; }
        if (p.ai.sup) { tx = p.ai.sup.x; ty = p.ai.sup.y; } }
      else p.ai.sup = null;
      const line = lastLine(t); if (prog(t, tx) > line && !p.ai.run) tx = fx(t, line - .005);            // quedarse en línea (no en fuera de juego)
      goTo(tx, ty, Math.hypot(tx - p.x, ty - p.y) > 16, null, true); return C;
    }
    // defendiendo
    if (owner && owner.t !== t) {
      const pr = pressers(t);
      if (p.fooled && p.fooled.until > simT) { goTo(p.fooled.x, p.fooled.y, true); return C; }
      if (pr[0] === p) { // el más cercano presiona y contiene; entra cuando hay ocasión
        const gx = own(t), d = dist(p, owner), tx = owner.x + (gx - owner.x) * (1.4 / Math.max(5, Math.abs(gx - owner.x))), ty = owner.y + (W / 2 - owner.y) * .05;
        goTo(tx, ty, d > 5, d < 5 ? Math.atan2(owner.y - p.y, owner.x - p.x) : null);
        const db = Math.hypot(ball.x - p.x, ball.y - p.y);
        const dk = EMB && EMB.cpu && EMB.cpu.includes(t) ? ({ "Fácil": .6, "Normal": 1, "Difícil": 1.25, "Leyenda": 1.45 }[EMB.diff] || 1) : 1;
        // DLS: si el que conduce viene lanzado hacia él o se deja el balón largo, el defensa entra con decisión
        const dbo = Math.hypot(ball.x - owner.x, ball.y - owner.y), atMe = owner.v > 4.5 && Math.cos(angD(owner.mh, Math.atan2(p.y - owner.y, p.x - owner.x))) > .6, longT = dbo > .9 && db < dbo + .2;
        if (db < (longT ? 2.2 : 1.6) && Math.random() < dt * (1.6 + (p.st.def - 70) * .04 + (atMe ? 3.2 : 0) + (longT ? 4 : 0)) * dk) tackle(p, longT && db > 1.4);
        else if (db < 3 && db > 1.6 && Math.random() < dt * .08 && prog(t, p.x) < .35) tackle(p, true);
        return C;
      }
      if (TEAMS[t].ment === 2 && pr[2] === p && dist(p, owner) < 18) { goTo(owner.x + Math.cos(owner.mh) * 2, owner.y + Math.sin(owner.mh) * 2, true); return C; }
      if ((pr[1] === p || (pr[2] === p && TEAMS[t].ment >= 1)) && M.turnLost === t && simT - (M.turnT || -9) < 3.5 && dist(p, owner) < 14) { goTo(owner.x, owner.y, true, Math.atan2(owner.y - p.y, owner.x - p.x)); return C; }   // presión tras pérdida
      // tapar el tiro: con el rival cerca del área, el segundo se mete en la línea balón-portería
      { const gx = own(t), dOG = Math.hypot(gx - owner.x, W / 2 - owner.y); if (dOG < (STREET ? 16 : 30) && (pr[1] === p || (pr[2] === p && dOG < 20)) && p.cat !== "fwd") { const k = (pr[1] === p ? 3.2 : 6) / Math.max(4, dOG); goTo(owner.x + (gx - owner.x) * k, owner.y + (W / 2 - owner.y) * k, true, Math.atan2(owner.y - p.y, owner.x - p.x)); return C; } }
      // cobertura: el tercero se queda detrás del que presiona, entre él y la portería
      if (pr[2] === p && pr[0] && p.cat !== "fwd" && dist(p, owner) < 22) { const gx = own(t), d0 = Math.max(3, Math.hypot(gx - pr[0].x, W / 2 - pr[0].y)), k = 4.5 / d0; goTo(pr[0].x + (gx - pr[0].x) * k, pr[0].y + (W / 2 - pr[0].y) * k, dist(p, owner) > 9, Math.atan2(owner.y - p.y, owner.x - p.x)); return C; }
      if (pr[1] === p) { const mate = bestMate(owner, 30); const tx = mate ? lerp(owner.x, mate.x, .45) : homePos(p).x, ty = mate ? lerp(owner.y, mate.y, .45) : homePos(p).y; goTo(tx, ty, true); return C; }
      // marca: el rival más peligroso de mi zona, siempre entre él y la portería
      const h = homePos(p); let mk = null, md = 9; for (const o of team(1 - t)) { if (o.gk || o === owner) continue; const d = Math.hypot(o.x - h.x, o.y - h.y); if (d < md) { md = d; mk = o; } }
      if (mk && p.cat !== "fwd") { const gx = own(t), k = 1.8 / Math.max(2, Math.hypot(gx - mk.x, W / 2 - mk.y)); const behind = prog(t, p.x) > prog(t, ball.x) - .03;
        // marca al lado del balón: un paso hacia la línea de pase (anticipa sin perder el lado de la portería)
        const gsx = mk.x + (gx - mk.x) * k, gsy = mk.y + (W / 2 - mk.y) * k, dm = Math.max(1, Math.hypot(owner.x - mk.x, owner.y - mk.y)), ln = clamp((p.st.def - 55) / 40, .2, .9) * (dm < 25 ? 1.3 : .6), lx = gsx + (owner.x - mk.x) / dm * ln, ly = gsy + (owner.y - mk.y) / dm * ln;
        goTo(lx, ly, behind && Math.hypot(mk.x - p.x, mk.y - p.y) > 8, Math.atan2(ball.y - p.y, ball.x - p.x)); return C; }
      { const behind = prog(t, p.x) > prog(t, ball.x) - .03; goTo(h.x, h.y, behind && Math.hypot(h.x - p.x, h.y - p.y) > 12, Math.atan2(ball.y - p.y, ball.x - p.x), !behind); } return C;
    }
    const h = homePos(p); goTo(h.x, h.y, Math.hypot(h.x - p.x, h.y - p.y) > 18, null, true); return C;
  }
  const lastLine = t => { const o = team(1 - t).map(q => prog(t, q.x)).sort((a, b) => b - a); return Math.max(.5, o[1] != null ? o[1] : .5); };
  let TRAJ = null, trajT = -1;
  function traj() { if (trajT === simT && TRAJ) return TRAJ; const b = Object.assign({}, ball), arr = [], h = 1 / 30;
    for (let k = 0; k <= 30; k++) { arr.push({ x: b.x, y: b.y, z: b.z, t: k * .1 }); for (let j = 0; j < 3; j++) { const sp = Math.hypot(b.vx, b.vy, b.vz); if (b.z > .001 || b.vz > 0) { const kd = .0125 * sp; b.vx -= kd * b.vx * h; b.vy -= kd * b.vy * h; b.vz -= (kd * b.vz + G) * h; b.z += b.vz * h; if (b.z <= 0) { b.z = 0; b.vz = b.vz < -1.2 ? -b.vz * .55 : 0; } } else { const hh = Math.hypot(b.vx, b.vy); if (hh > 0) { const ns = Math.max(0, hh - (FRA + FRB * hh) * h); b.vx *= ns / hh; b.vy *= ns / hh; } } b.x += b.vx * h; b.y += b.vy * h; } }
    TRAJ = arr; trajT = simT; return arr; }
  function headerPt(p) { const T = traj(); let best = null; for (const b of T) { if (b.t === 0) continue; if (b.z > 1.2 && b.z < 2.4 && Math.hypot(b.x - p.x, b.y - p.y) / Math.max(4, vSpr(p) * .85) <= b.t + .1) { best = b; } else if (best && b.z < 1.2) break; } return best || interceptPt(p); }
  function interceptPt(p) { const T = traj(); for (const b of T) { if (b.t === 0) continue; if (b.z < 1.8 && Math.hypot(b.x - p.x, b.y - p.y) / Math.max(4, vSpr(p) * .85) <= b.t) return b; } return T[T.length - 1]; }
  const CH = {}; function chaser(t) { if (CH[t] && CH[t].at === simT) return CH[t].p; const r = chaser_(t); CH[t] = { at: simT, p: r }; return r; }
  function chaser_(t) { let b = null, bt = 1e9; for (const p of team(t)) { if (p.gk || p.down > 0) continue; if (t === M.humanTeam && p === M.human) continue; const ip = interceptPt(p), tt = Math.hypot(ip.x - p.x, ip.y - p.y) / vSpr(p); if (tt < bt) { bt = tt; b = p; } } return b; }
  function pressers(t) { const o = M.owner; return team(t).filter(p => !p.gk && p.down <= 0 && !(t === M.humanTeam && p === M.human)).sort((a, b) => dist(a, o) - dist(b, o)); }
  // el que lleva el balón decide: tirar, pasar (raso, al hueco, centro) o conducir
  function carrierAI(p, dt, C) {
    // regates de la IA: con un rival encima y buen regate, a veces amaga, hace la bicicleta, la ruleta o el caño
    { const d0 = !p.one && p.v > 1.5 ? nearestDef(p) : null; if (d0 && dist(d0, p) < 2.6 && Math.abs(angD(p.h, Math.atan2(d0.y - p.y, d0.x - p.x))) < .8 && Math.random() < dt * .3 * clamp((p.st.dri - 62) / 25, 0, 1.3)) {
      const pk = aiSkill(p, d0); if (pk) { skillMove(p, pk.k, { dir: pk.dir, m: 1, spr: pk.k === "feint" }); return C; } } }
    const t = p.t, gx = opp(t), dG = Math.hypot(gx - p.x, W / 2 - p.y), ang = Math.abs(Math.atan2(W / 2 - p.y, gx - p.x) - (M.dirOf[t] > 0 ? 0 : Math.PI));
    const press = openness(p, t);
    // el compañero humano pide el balón: se la da en cuanto la línea de pase está limpia
    if (M.call && simT - M.call.at < 1.8 && M.call.p.t === t && M.call.p !== p && !p.req && !p.one) { const q = M.call.p, d = dist(p, q), lx = q.x + Math.cos(q.mh) * q.v * .5, ly = q.y + Math.sin(q.mh) * q.v * .5;
      if (d > 3 && d < 50 && (M.call.k === "lob" || passRisk(p, lx, ly) < 1.4)) { passTo(p, q, M.call.k === "thru" ? "thru" : M.call.k === "lob" || d > 32 ? "lob" : "pass", .55); M.call = null; return C; } }
    p.ai.t -= dt;
    if (p.ai.t <= 0 && !p.req && !p.one) {
      p.ai.t = .25 + Math.random() * .35;
      // tiro
      const SR = STREET ? 15 : 27; if (dG < SR && Math.cos(ang) > .4) { const blocked = laneRisk(p, gx, W / 2, t), chance = (1 - dG / SR) * 1.55 - blocked * .2 + (press < 2 ? -.15 : 0);
        if (chance > .45 || (dG < SR * .48 && chance > .2) || Math.random() < chance * .25) { const side = Math.random() < .5 ? -1 : 1, fin = dG > SR * .52 && Math.random() < .5;
          requestKick(p, { k: "shot", p: clamp(.45 + dG * .015 + Math.random() * .2, .3, .9), fin, tx: gx + M.dirOf[t] * .2, ty: W / 2 + side * GW / 2 * (.2 + Math.random() * .66), press: press < 1.5 ? .1 : 0 }); return C; } }
      // centro desde la banda en el último tercio
      if (prog(t, p.x) > .76 && Math.abs(p.y - W / 2) > 18 && Math.random() < .6) { const tgt = team(t).filter(q => !q.gk && q !== p && prog(t, q.x) > .78 && Math.abs(q.y - W / 2) < 12).sort((a, b) => openness(b, t) - openness(a, t))[0];
        if (tgt) { passTo(p, tgt, "cross", .7); const z = M.pass ? null : null; return C; } }
      // pases
      let best = null, bs = press < 2.5 ? 0 : 1.2;
      for (const q of team(t)) { if (q === p || q.down > 0) continue; const d = dist(p, q); if (d < 5 || d > 42) continue;
        const gain = prog(t, q.x) - prog(t, p.x), op = Math.min(6, openness(q, t)), risk = passRisk(p, q.x + Math.cos(q.mh) * q.v * .4, q.y + Math.sin(q.mh) * q.v * .4), off = prog(t, q.x) > lastLine(t) + .003 && prog(t, q.x) > .5;
        let s = gain * 15 + Math.min(4, op) * .6 - risk * 2.6 - d * .04 - (q.gk ? 2.5 : 0) - (off ? 9 : 0) - (op < 2.5 ? 2 : 0) + (Math.random() - .5) * .8;
        let k = "pass"; if (d > 30 || risk > 1.2) { if (op > 4.5 && d > 14) { k = "lob"; s -= 1; } else s -= 4; }
        if (q.ai.run && !off && q.cat === "fwd" && thruSpot(p, q)) { s += 2.2; k = "thru"; }
        if (q === M.lockP && risk < 1) s += 1.1;
        if (q.ai.run && q.ai.run.wall === p && simT - (q.ai.wallT || -9) < 2.2 && risk < 1.3 && !off) { s += 2.6; k = "pass"; }   // devolver la pared
        { const crowd = team(1 - t).filter(o => Math.hypot(o.x - p.x, o.y - p.y) < 13).length, far = Math.abs(q.y - p.y); if (crowd >= 3 && far > W * .4 && op > 5) { s += 1.6 + (crowd - 3) * .5; if (d > 26) k = "lob"; } }   // cambio de juego al lado débil
        if (s > bs) { bs = s; best = [q, k]; } }
      const dribT = simT - (p.ai.gotT || simT);
      if (best && (press < 3 || bs > 1.8 || (dribT > 1.8 && bs > .9) || Math.random() < .12)) { passTo(p, best[0], best[1], .5 + Math.random() * .2); return C; }
    }
    // conducir: hacia la portería, apartándose del rival más cercano
    let dirx = M.dirOf[t], diry = (W / 2 - p.y) / 60;
    for (const o of team(1 - t)) { const dx = p.x - o.x, dy = p.y - o.y, d = Math.hypot(dx, dy); if (d < 6 && d > .1) { dirx += dx / d * (6 - d) * .25; diry += dy / d * (6 - d) * .35; } }
    if (p.y < 6) diry += (6 - p.y) * .35; else if (p.y > W - 6) diry -= (p.y - (W - 6)) * .35;   // no conducir hacia la banda: se sale
    { const d0 = nearestDef(p); if (d0 && dist(d0, p) < 2.6 && !p.one && simT - (p.skillT || -9) > 2.5 && Math.random() < dt * (.13 + Math.max(0, p.st.dri - 74) * .035)) {   // la máquina también regatea (más los buenos regateadores)
        const pk = aiSkill(p, d0); if (pk) { skillMove(p, pk.k, { dir: pk.dir, m: 1, spr: pk.k === "feint" }); return { dir: null, m: 0 }; } } }
    C.dir = Math.atan2(diry, dirx); C.m = 1; C.spr = press > 6 && prog(t, p.x) > .4;
    return C;
  }

  /* ---------- porteros (uno por equipo) ---------- */
  const hv = new THREE.Vector3(), hv2 = new THREE.Vector3();
  const gkS = [{ mode: "idle" }, { mode: "idle" }];
  function gkHands(g) { flushPose(g); g.hands[0].getWorldPosition(hv); g.hands[1].getWorldPosition(hv2); hv.add(hv2).multiplyScalar(.5); hv.x += Math.cos(g.h) * .08; hv.z += Math.sin(g.h) * .08; ball.x = hv.x + L / 2; ball.y = hv.z + W / 2; ball.z = Math.max(0, hv.y - BR); ball.vx = ball.vy = ball.vz = 0; }
  function gkReact(t) {
    const g = GKP(t), gl = own(t), s = gkS[t]; if (s.mode === "diving" || (s.mode === "dive" && s.pen)) return;
    let atG = null; for (let tt = .03; tt < 2.5; tt += .03) { const b = predictBall(tt); if (!atG && (b.x - g.x) * -M.dirOf[t] >= -.2) atG = { b, tt }; if ((b.x - gl) * -M.dirOf[t] >= -.3) { const onT = Math.abs(b.y - W / 2) < GW / 2 + .1 && b.z < GH + .1;
      const bg = atG ? atG.b : b; const tg = atG ? atG.tt : tt;
      if (onT) TEAMS[1 - t].stats.ont++;
      if (!onT && Math.abs(b.y - W / 2) > GW / 2 + .4) return;
      // decisión de parada (como en FIFA): según el tiempo que tiene, lo que tiene que estirarse, la altura y la calidad del portero
      const reach = Math.abs(bg.y - g.y), sp0 = Math.hypot(ball.vx, ball.vy, ball.vz), react = .12 - (g.st.gk - 80) * .003;
      const need = react + Math.max(0, reach - .9) / (5.3 + (g.st.gk - 80) * .06), margin = tg - need;
      let pS = 1 / (1 + Math.exp(-margin * 4.5)); if (bg.z > 1.95) pS *= .8; if (bg.z < .35 && reach > 1.6) pS *= .88; if (tg < .3) pS = Math.max(pS, reach < .8 ? .72 : reach < 1.6 ? .38 : .1); if (g.one || g.down > 0) pS *= .35; if (!onT) pS = 1;
      pS = clamp(pS * (.92 + (g.st.gk - 80) * .012) * (1 - clamp((reach - 1) * .16, 0, .32) * clamp((1.25 - tg) / .6, 0, 1)) + (sp0 < 18 ? .08 : 0), .02, .985);   // tiro pegado al palo: mucho más difícil de parar
      if (onT && !g.one && g.down <= 0) { if (reach < .9 && tg > .14) pS = Math.max(pS, .94); else if (reach < 1.5 && tg > .3) pS = Math.max(pS, .78); }   // un tiro al cuerpo casi siempre se para
      const sh = M.shot; if (sh && sh.p.t !== t && simT - sh.t < .1) { if (sh.perf && reach > 1.6) pS *= .72; if (sh.fin && reach > 2) pS *= .88; if (sh.chip) pS *= Math.abs(g.x - gl) > 3 ? .25 : .7; }   // golazos: tiro perfecto a la escuadra, rosca al palo largo, vaselina
      gkS[t] = { mode: "dive", react: .1 + Math.random() * .07 - (g.st.gk - 80) * .002, t: tg, by: bg.y, bz: bg.z, ws: Math.random() < pS, pS }; return; } }
  }
  function gkStep(t, dt) {
    if (DR && DR.noGK && DR.noGK.includes(t)) { const g0 = GKP(t); if (g0) { g0.wrap.visible = false; g0.x = -45; g0.y = -45; g0.v = 0; } return; }
    const g = GKP(t), s = gkS[t], gl = own(t), dirF = M.dirOf[t];
    if (s.mode === "dive" && !g.one) {
      s.t -= dt; s.react -= dt; const dy = s.by - g.y, ady = Math.abs(dy), left = (dy * dirF) < 0 ? false : true;
      const lft = (dirF > 0 ? dy < 0 : dy > 0);   // izquierda del portero (mira hacia el campo)
      const D = ady < 1.1 ? (s.bz > .55 ? ["GoalkeeperCatch", .35, .8, 0] : ["GoalkeeperScoop", .3, .8, 0]) : s.bz < .8 ? (lft ? ["GoalkeeperBodyBlock", .45, 1.0, 1.0] : ["GoalkeeperBodyBlock1", .4, .87, .87]) : (lft ? ["GoalkeeperDivingSave1", .55, 1.27, 1.9] : ["GoalkeeperDivingSave", .52, 1.2, 2.3]);
      const ts = 1.5, tReach = (D[2] - D[1]) / ts;
      if ((s.t <= tReach + .04 || s.t < .5) && s.react <= 0) { const t0 = Math.max(D[1], D[2] - Math.max(.05, s.t - .02) * ts); const o = startOne(g, D[0], { ts, t0, end: Math.min(META[D[0]].dur, D[2] + 1.2), fadeIn: .06, h0: g.h }); if (o) { if (!D[3]) o.rootScale = 0; { const need = dy - Math.sign(dy) * D[3] * clamp((D[2] - t0) / Math.max(.01, D[2] - D[1]), 0, 1), cap = .85 + (g.st.gk - 80) * .025; o.warp = { x: 0, y: s.ws ? clamp(need, -1.8, 1.8) : clamp(need * .55, -cap, cap), t: Math.max(.05, D[2] - t0) }; } } s.mode = "diving"; }
    }
    // el balón cruza la línea del portero en este fotograma (a 25-30 m/s avanza casi un metro por fotograma: sin esto se «saltaba» la parada)
    let crossNow = false; { const rel = (ball.x - g.x) * dirF; if (s.ws === true && (s.mode === "diving" || s.mode === "dive") && s.prevRel != null && s.prevRel > 0 && rel <= .15 && Math.abs(ball.y - g.y) < 3.3 && ball.z < 2.6 && !ball.inNet) crossNow = true; s.prevRel = rel; }
    if ((s.mode === "diving" || s.mode === "idle" || s.mode === "rush" || crossNow) && !ball.hold && M.phase === "play") {
      const b = ball, sp = Math.hypot(b.vx, b.vy, b.vz);
      if (!b.inNet && sp > 3 && (Math.hypot(b.x - g.x, b.y - g.y) < 3 || crossNow) && simT - (s.lastSave || -9) > .6 && !(M.last === g && simT - (s.relT || -9) < .8) && !(M.last && M.last.t === t && !M.last.gk && !gkHandsOK(t)) && M.owner !== g) {
        flushPose(g); g.hands[0].getWorldPosition(hv); g.hands[1].getWorldPosition(hv2); const hm = hv.clone().add(hv2).multiplyScalar(.5), bw = P3(b.x, b.y, b.z + BR);
        const dH = Math.min(hv.distanceTo(bw), hv2.distanceTo(bw), hm.distanceTo(bw)), bodyY = clamp(bw.y, .1, 1.75), dB = Math.hypot(b.x - g.x, b.y - g.y) + Math.abs(bw.y - bodyY) * .6;
        // con parada decidida, cualquier balón que llegue a su zona de estirada se para; sin ella, solo si le da en el cuerpo
        const forced = crossNow || (s.ws === true && s.mode === "diving" && Math.abs(b.x - g.x) < .7 && Math.abs(b.y - g.y) < 3.2 && b.z < 2.7);
        const touched = s.ws === false ? dB < .4 : (dH < .34 || dB < .45);
        if (forced || touched) {
          const lat = Math.abs(b.y - g.y);
          if (sp < 24 && lat < 1.2 && b.z > .1 && b.z < 1.9 && Math.random() < (sp < 17 ? .93 : .6) + (g.st.gk - 80) * .02) { gkCatch(t); }
          else { // despeje con la mano hacia fuera: a córner o lejos de la portería
            const sd = Math.sign(b.y - W / 2) || (Math.random() < .5 ? -1 : 1), weak = clamp((86 - g.st.gk) / 20, 0, 1) * .16;
            if (b.z > 1.75 && sp > 15 && Math.random() < .65) { b.vx = -dirF * (2.5 + Math.random() * 1.5); b.vy = sd * (1 + Math.random() * 2); b.vz = 6.5 + Math.random() * 1.5; b.z = Math.max(b.z, 2); }   // a córner por encima del larguero
            else if (Math.random() < weak) { b.vx = dirF * (4 + Math.random() * 3); b.vy = (Math.random() - .5) * 5; b.vz = .8 + Math.random(); }   // rechace al centro: ¡peligro!
            else if (Math.abs(b.y - W / 2) > 1.2 && Math.random() < .6) { b.vx = -dirF * (1.2 + Math.random()); b.vy = sd * (8 + Math.random() * 3); b.vz = 2.5 + Math.random() * 2.5; } else { b.vx = dirF * (.6 + Math.random() * 1.6); b.vy = sd * (7 + Math.random() * 4); b.vz = 2 + Math.random() * 2.5; }   // rechace: hacia fuera, nunca al centro del área
            b.x = g.x + dirF * .3; gkS[t] = { mode: "idle", lastSave: simT }; M.last = g; M.owner = null; msg(b.vz > 6 ? "¡LA SACA POR ENCIMA DEL LARGUERO!" : lat > 1.6 ? (sp > 22 ? "¡PARADÓN A UNA MANO!" : "¡PARADÓN!") : "¡PARADA!", 1.4); kickSnd(8); crowdOoh(lat > 1.6 ? 1.2 : .7); later(.9, () => applause(2, .8)); M.crowdEx = Math.max(M.crowdEx || 0, .5); }
        }
      }
    }
    // portero con el balón en los pies (cesión o balón que no puede coger con las manos): lo controla y lo juega como un jugador de campo
    g.run = false; let feetBusy = false;
    if (M.phase === "play" && !ball.hold && !g.one && !g.req && !M.so) {
      const own_ = M.owner === g, bsp = Math.hypot(ball.vx, ball.vy);
      if (own_ && g.feet) {   // con el balón controlado
        feetBusy = true;
        const fw = g.h; ball.x = lerp(ball.x, g.x + Math.cos(fw) * .55, .35); ball.y = lerp(ball.y, g.y + Math.sin(fw) * .55, .35); ball.vx = ball.vy = 0; ball.z = 0;
        const pr = team(1 - t).filter(o => !o.sent).reduce((m, o) => Math.min(m, dist(o, g)), 99), held = simT - g.feet;
        const mine = t === M.humanTeam && !M.lockP && !(R2 && NET.peer && t === R2.team);
        if (mine && (lastI.passD || lastI.thruD || lastI.lobD || lastI.shootD)) { const k = lastI.lobD || lastI.shootD ? "lob" : "pass", dirH = lastI.dir != null ? lastI.dir : (M.dirOf[t] > 0 ? 0 : Math.PI);
          const q = assistTarget(g, dirH, k, lastI.dir != null); if (q) passTo(g, q, k, k === "lob" ? .85 : .6); else requestKick(g, { k: "clear", p: .8, tx: g.x + Math.cos(dirH) * 40, ty: clamp(g.y + Math.sin(dirH) * 40, 3, W - 3) }); g.feet = null; }
        else if ((!mine && held > .45 + Math.random() * .5) || pr < 3.2 || held > (mine ? 2.5 : 2)) { g.feet = null; gkFeet(t, pr < 5); }
        else if (mine && held < .1) msg("PORTERO  ·  J/A pase corto · L/X en largo", 1.6);
      } else if (!own_ && s.mode !== "dive" && s.mode !== "diving" && ((M.last && M.last.t === t && !M.last.gk) || bsp < 8) && !(M.shot && M.shot.p.t !== t && simT - M.shot.t < 1.5) && !gkHandsOK(t) && ball.z < .7 && !(M.owner && M.owner !== g) && inArea(t, ball.x, ball.y, 6)) {   // va a por el balón (cesión que le llega rápida, rechace…)
        const toMe = M.pass && M.pass.to === g, coming = bsp > 1 && ((ball.vx * (g.x - ball.x) + ball.vy * (g.y - ball.y)) > 0), dB = Math.hypot(ball.x - g.x, ball.y - g.y);
        if (toMe || (coming && dB < 22) || dB < 7) {
          let ip = null; for (let tt = .05; tt < 2.5; tt += .05) { const pb = predictBall(tt); if (Math.hypot(pb.x - g.x, pb.y - g.y) / 5.2 <= tt) { ip = pb; break; } } if (!ip) ip = predictBall(1);
          const dx = ip.x - g.x, dy = ip.y - g.y, d = Math.hypot(dx, dy); g.v = Math.min(5.2, d * 4); g.run = g.v > 1; s.mode = "rush";
          if (d > .05) { g.h += angD(g.h, Math.atan2(dy, dx)) * Math.min(1, dt * 8); g.mh = g.h; g.x += dx / d * g.v * dt; g.y += dy / d * g.v * dt; }
          if (dB < 1.05 && ball.z < .6) { const outH = Math.atan2(W / 2 - g.y, opp(t) - g.x) * .3 + (M.dirOf[t] > 0 ? 0 : Math.PI) * .7; g.h = g.mh = Math.abs(angD(M.dirOf[t] > 0 ? 0 : Math.PI, g.h)) < 1.6 ? g.h : (M.dirOf[t] > 0 ? 0 : Math.PI);
            ball.vx = ball.vy = 0; ball.z = 0; touchBy(g); M.owner = g; g.feet = simT; s.mode = "idle"; touchSfx(3); }
          feetBusy = true; }
      }
    }
    if (M.owner !== g) g.feet = null;
    // salir a por balones sueltos en el área / 1 contra 1
    if (!feetBusy && (s.mode === "idle" || s.mode === "rush") && !g.one && !ball.inNet && M.phase === "play" && !ball.hold) {
      const SC = STREET ? .45 : 1, inBox = inArea(t, ball.x, ball.y), carrier = M.owner && M.owner.t !== t ? M.owner : null, bsp = Math.hypot(ball.vx, ball.vy);
      const dGoal = (x, y) => Math.hypot(x - gl, (y - W / 2) * 1.3);
      let target = null;
      if (ball.z > 1 && M.pass && M.pass.t !== t && (M.pass.k === "cross" || M.pass.k === "lob")) { for (const b of traj()) { if (b.t < .15) continue; if (b.z > 1.3 && b.z < 2.5 && Math.abs(b.x - gl) < 9 * SC && Math.abs(b.y - W / 2) < 8 * SC && Math.hypot(b.x - g.x, b.y - g.y) / 5.5 + .2 <= b.t) { const at = nearestTo(1 - t, b.x, b.y); if (!at || Math.hypot(at.x - b.x, at.y - b.y) / 7 > b.t * .8 || Math.abs(b.x - gl) < 5.5 * SC) { target = { x: b.x, y: b.y, air: true }; } break; } } }
      if (target && target.air) { s.mode = "rush"; g.airT = simT; const dx = target.x - g.x, dy = target.y - g.y, d = Math.hypot(dx, dy); g.v = Math.min(6, d * 4); g.run = g.v > 1; if (d > .05) { g.h += angD(g.h, Math.atan2(dy, dx)) * Math.min(1, dt * 8); g.mh = g.h; g.x += Math.cos(g.h) * g.v * dt; g.y += Math.sin(g.h) * g.v * dt; }
        if (Math.hypot(ball.x - g.x, ball.y - g.y) < 1.3 && ball.z > .9 && ball.z < 2.8) {
          // con un rival encima prefiere despejar de puños; solo, la bloca
          const at = nearestTo(1 - t, ball.x, ball.y), crowd = at ? clamp((2.2 - Math.hypot(at.x - ball.x, at.y - ball.y)) / 2.2, 0, 1) : 0;
          if (Math.random() < .88 - crowd * .45 + (g.st.gk - 80) * .01) { startOne(g, "GoalkeeperCatch", { ts: 1.6, t0: .3, end: 1.2, rootScale: 0, h0: g.h }); gkCatch(t); }
          else { startOne(g, "GoalkeeperCatch", { ts: 2, t0: .25, end: .9, rootScale: 0, h0: g.h }); const sd = Math.sign(ball.y - W / 2) || 1; ball.vx = M.dirOf[t] * (9 + Math.random() * 5); ball.vy = sd * (3 + Math.random() * 5); ball.vz = 5 + Math.random() * 2; M.last = g; M.owner = null; M.pass = null; kickSnd(10); msg("¡DESPEJE DE PUÑOS!", 1.2); crowdOoh(.6); } s.mode = "idle"; } }
      else if (inBox && !carrier && bsp < 16 && ball.z < 2 && gkHandsOK(t)) { for (let tt = .1; tt < 3; tt += .1) { const pb = predictBall(tt), tg = Math.hypot(pb.x - g.x, pb.y - g.y) / 6.2 + .25; const att = nearestTo(1 - t, pb.x, pb.y); const ta = att ? Math.hypot(pb.x - att.x, pb.y - att.y) / 7 : 9; if (tg <= tt && tg < ta * .72) { if (inArea(t, pb.x, pb.y, -.8) && dGoal(pb.x, pb.y) < 14 * SC) target = pb; break; } } }
      else if (carrier && M.gkCall && simT - (M.gkCall[t] || -9) < .2 && dist(carrier, g) < (STREET ? 12 : 26) && inArea(t, carrier.x, carrier.y, STREET ? 4 : 9)) target = { x: ball.x + ball.vx * .2, y: ball.y + ball.vy * .2, one: true, called: true };
      else if (carrier && inBox) { const lb = Math.hypot(ball.x - carrier.x, ball.y - carrier.y), dc = dGoal(carrier.x, carrier.y), central = Math.abs(carrier.y - W / 2) < 9 * SC;
        const free = !team(t).some(q => !q.gk && dist(q, carrier) < 2.2);
        if (central && free && (dist(carrier, g) < 4.5 * SC || (lb > 1.1 && dist(carrier, g) < 8 * SC && dc < 12 * SC))) target = { x: lerp(ball.x + ball.vx * .25, g.x, lb > 1 ? .05 : .25), y: lerp(ball.y + ball.vy * .25, g.y, lb > 1 ? .05 : .25), one: true, heavy: lb > 1 };
        else if (central && dc < 16 * SC) { const a = Math.atan2(carrier.y - W / 2, carrier.x - gl), st = Math.min(3.5 * SC, dc * .22); target = { x: gl + Math.cos(a) * st, y: W / 2 + Math.sin(a) * st, set: true }; } }
      if (target && !target.air) {
        s.mode = "rush"; const dx = target.x - g.x, dy = target.y - g.y, d = Math.hypot(dx, dy); g.v = Math.min(target.set ? 3 : target.called ? 6.4 : target.one ? 5.2 : 6.2, d * 4); g.run = g.v > 1;
        if (d > .05) { g.h += angD(g.h, Math.atan2(dy, dx)) * Math.min(1, dt * 8); g.mh = g.h; g.x += Math.cos(g.h) * g.v * dt; g.y += Math.sin(g.h) * g.v * dt; }
        const db = Math.hypot(ball.x - g.x, ball.y - g.y);
        if (!target.set && db < (target.one ? (target.heavy ? 3.4 : 2.6) : 1.4)) { const n = ball.z > .6 ? "GoalkeeperCatch" : target.one ? "GoalkeeperBodyBlock1" : "GoalkeeperScoop"; const o = startOne(g, n, { ts: 1.5, end: 1.3, fadeIn: .1, h0: g.h });
          if (o) { o.rootScale = 0; o.warp = { x: ball.x - g.x - Math.cos(g.h) * .4, y: ball.y - g.y - Math.sin(g.h) * .4, t: .35 }; o.onT = .35; o.on = () => { if (Math.hypot(ball.x - g.x, ball.y - g.y) < 1.25 && ball.z < 1.6 && Math.random() < (target.one ? .8 + (g.st.gk - 80) * .01 + (target.heavy ? .1 : 0) : .97)) gkCatch(t); }; }
          s.mode = "idle"; }
      } else if (s.mode === "rush" && !(target && target.air)) s.mode = "idle";
    }
    if (!feetBusy && M.phase === "play" && !ball.hold && !g.one && !g.req && !gkHandsOK(t) && ball.z < .6 && Math.hypot(ball.vx, ball.vy) < 9 && !(M.owner && M.owner.t !== t)) {   // balón suelto cerca sin poder usar las manos: va y lo juega con el pie
      const ip = Math.hypot(ball.x - g.x, ball.y - g.y); if (inArea(t, ball.x, ball.y, -.3) && (STREET ? (ip < 4 && Math.abs(ball.y - W / 2) < 5) : ip < 9)) gkFeet(t); }
    if (g.req && !g.one) { const a = Math.atan2(g.req.ty - ball.y, g.req.tx - ball.x), tx = ball.x - Math.cos(a) * .9, ty = ball.y - Math.sin(a) * .9, d = Math.hypot(tx - g.x, ty - g.y); if (d > .1) { const sp = Math.min(3.5, d * 4); g.x += (tx - g.x) / d * sp * dt; g.y += (ty - g.y) / d * sp * dt; g.v = sp; } g.h += angD(g.h, a) * Math.min(1, dt * 6); g.mh = g.h; }
    else if (!feetBusy && s.mode === "idle" && !g.one && simT - (g.airT || -9) > .05) {   // colocación en la bisectriz
      const db = Math.hypot(gl - ball.x, W / 2 - ball.y), ty = W / 2 + clamp((ball.y - W / 2) * clamp(3.5 / Math.max(db, 1), .08, .45), -GW / 2 + .5, GW / 2 - .5), tx = gl + dirF * clamp(.6 + db * .045, .6, 3);
      const dx = tx - g.x, dy = ty - g.y, d = Math.hypot(dx, dy), sp = Math.min(d * 3, 4.2);
      g.x += dx / (d || 1) * sp * dt; g.y += dy / (d || 1) * sp * dt; g.h += angD(g.h, Math.atan2(ball.y - g.y, ball.x - g.x)) * Math.min(1, dt * 5); g.mh = g.h; g.v = sp; }
    if (s.mode === "hold") { if (!g.one) startOne(g, "GoalkeeperCatch", { t0: META.GoalkeeperCatch.dur * .93, ts: 0, end: 99, fadeIn: .2 }); gkHands(g); s.t -= dt;
      const mineH = t === M.humanTeam && !M.lockP && !(R2 && NET.peer && t === R2.team);
      if (mineH && s.t < 2.6 && (lastI.passD || lastI.thruD || lastI.lobD || lastI.shootD)) gkDistribute(t, { k: lastI.lobD || lastI.shootD ? "lob" : "pass", dir: lastI.dir });
      else if (s.t <= 0) gkDistribute(t); }
    if (s.mode === "throw" && g.one && g.one.hold) { gkHands(g); const o = g.one; g.hands[0].getWorldPosition(hv); const fa = (hv.x + L / 2 - g.x) * Math.cos(g.h) + (hv.z + W / 2 - g.y) * Math.sin(g.h);
      if (o.t > .6 && o.prevA != null && fa < o.prevA - .003 && o.prevA > .15 && !o.fired) { o.fired = true; o.on(); } o.prevA = fa; }
    stepOne(g, dt);
    // el portero nunca sale de su área (ni en fútbol 11 ni en la jaula)
    if (g.req && !inArea(t, ball.x, ball.y, .6)) g.req = null;
    if (!M.so) { const AD = (STREET ? 6.3 : 16.5) - .4, AW = (STREET ? 7.2 : 20.16) - .3; g.x = own(t) + dirF * clamp((g.x - own(t)) * dirF, .15, AD); g.y = clamp(g.y, W / 2 - AW, W / 2 + AW); }
    if (ball.hold === g || s.mode === "throw" || s.mode === "hold") { const AD = (STREET ? 6.3 : 16.5) - .8, AW = (STREET ? 7.2 : 20.16) - .6; g.x = own(t) + dirF * clamp((g.x - own(t)) * dirF, .3, AD); g.y = clamp(g.y, W / 2 - AW, W / 2 + AW); }
  }
  function handsBall(p) { flushPose(p); p.hands[0].getWorldPosition(hv); p.hands[1].getWorldPosition(hv2); hv.add(hv2).multiplyScalar(.5); ball.x = hv.x + L / 2 + Math.cos(p.h) * .06; ball.y = hv.z + W / 2 + Math.sin(p.h) * .06; ball.z = Math.max(0, hv.y - BR * .5); ball.vx = ball.vy = ball.vz = 0; }
  // manos: solo dentro de su área y sin cesión con el pie de un compañero (si no, juega con el pie como uno más)
  function inArea(t, x, y, m = 0) { const AD = STREET ? 6.3 : 16.5, AW = STREET ? 7.2 : 20.16; return Math.abs(x - own(t)) < AD + m && Math.abs(y - W / 2) < AW + m; }
  function gkHandsOK(t) { const AD = STREET ? 6.3 : 16.5, AW = STREET ? 7.2 : 20.16, inA = Math.abs(ball.x - own(t)) < AD && Math.abs(ball.y - W / 2) < AW;
    const back = M.last && M.last.t === t && !M.last.gk && !(ball.hdrT && simT - ball.hdrT < 2 && M.lastHdr === M.last); return inA && !back; }
  // salida del portero a petición: mantén Y / Triángulo (o X del teclado, o HUECO en el móvil) mientras defiendes
  function gkRushIn(I, t) { if (t == null || t < 0 || !I || M.phase !== "play") return; const o = M.owner; if (!(o && o.t !== t) && !(M.pass && M.pass.t !== t)) return; if (I.nut) { (M.gkCall = M.gkCall || {})[t] = simT; } }
  function gkFeet(t, press) { const g = GKP(t); if (g.req || g.one) return; const mate = team(t).filter(q => !q.gk && !q.sent && openness(q, t) > 4 && dist(q, g) < 30 && passRisk(g, q.x, q.y) < .6).sort((a, b) => openness(b, t) - openness(a, t))[0];
    if (mate && (!press || openness(mate, t) > 7) && Math.random() < .85) requestKick(g, { k: "pass", p: .5, tx: mate.x, ty: mate.y, to: mate }); else requestKick(g, { k: "clear", p: .8, tx: g.x + M.dirOf[t] * (STREET ? 18 : 35), ty: clamp(g.y + (Math.random() - .5) * 20, 4, W - 4) }); }
  function gkCatch(t) { if (!gkHandsOK(t)) { const g = GKP(t); ball.vx = M.dirOf[t] * (2 + Math.random() * 3); ball.vy = (Math.random() - .5) * 4; ball.vz = Math.min(ball.vz, .5); M.last = g; M.owner = null; return; } const g = GKP(t); ball.vx = ball.vy = ball.vz = 0; gkS[t] = { mode: "hold", t: t === M.humanTeam && !M.lockP ? 3.2 : 1.4 }; ball.hold = g; M.owner = g; M.last = g; M.pass = null; msg(t === M.humanTeam && !M.lockP ? "¡ATRAPADA!  ·  J/A sacar en corto · L/X en largo" : "¡ATRAPADA!", 1.6); touchSfx(6); later(.4, () => applause(1.5, .6)); }
  function gkDistribute(t, o0) {
    const g = GKP(t), dirH = o0 && o0.dir != null ? o0.dir : (M.dirOf[t] > 0 ? 0 : Math.PI);
    const pick = o0 ? assistTarget(g, dirH, o0.k === "lob" ? "lob" : "pass", o0.dir != null) : null;
    const safe = q => q && openness(q, t) > 4.5 && passRisk(g, q.x, q.y) < .8;
    const auto = team(t).filter(q => !q.gk && !q.sent && dist(q, g) < 40 && safe(q)).sort((a, b) => (prog(t, b.x) - prog(t, a.x)) * 10 + openness(b, t) - openness(a, t))[0];
    const mate = (o0 && o0.k !== "lob" && pick && safe(pick) && pick) || auto || mid(t), longK = !auto && !(o0 && o0.k !== "lob" && safe(pick));
    if (META.GoalkeeperDropKick && (o0 ? o0.k === "lob" || longK : (longK || dist(mate, g) > 30 || Math.random() < .35))) { const fw = (o0 && pick) || team(t).filter(q => !q.gk).sort((a, b) => prog(t, b.x) - prog(t, a.x))[Math.floor(Math.random() * 3)];
      g.h = g.mh = Math.atan2(fw.y - g.y, fw.x - g.x); const o = startOne(g, "GoalkeeperDropKick", { ts: 1.35, end: 3.2, h0: g.h, rootScale: .5 }); gkS[t] = { mode: "throw" };
      if (o) { o.hold = true; o.during = () => { if (!o.fired && o.t < META.GoalkeeperDropKick.kick.t - .05) handsBall(g); }; o.onT = META.GoalkeeperDropKick.kick.t; o.after = () => { if (!o.fired) { o.fired = true; o.on(); } };
        o.on = () => { o.hold = false; ball.hold = null; const tx = fw.x + (Math.random() - .5) * 6, ty = fw.y + (Math.random() - .5) * 6, d = Math.hypot(tx - ball.x, ty - ball.y), a = Math.atan2(ty - ball.y, tx - ball.x), T = 1.6 + d * .022, sp = d / T;
          ball.vx = Math.cos(a) * sp; ball.vy = Math.sin(a) * sp; ball.vz = G * T * .5; ball.z = Math.max(ball.z, .5); M.owner = null; M.last = g; gkS[t] = { mode: "idle", relT: simT }; kickSnd(20); registerPass(g, { k: "lob", to: fw }); fw.ai.recv = { at: simT }; }; return; } }
    g.h = Math.atan2(mate.y - g.y, mate.x - g.x); g.mh = g.h;
    const o = startOne(g, "GoalkeeperOverhandThrow", { ts: 1.3, end: 2.2, h0: g.h }); gkS[t] = { mode: "throw" };
    if (o) { o.hold = true; o.after = () => { if (!o.fired) { o.fired = true; o.on(); } }; o.on = () => { o.hold = false; ball.hold = null; const d = dist(mate, g), a = Math.atan2(mate.y - ball.y, mate.x - ball.x), sp = 7 + d * .35;
      ball.vx = Math.cos(a) * sp; ball.vy = Math.sin(a) * sp; ball.vz = 3.2; ball.z = Math.max(ball.z, 1.4); M.owner = null; M.last = g; gkS[t] = { mode: "idle", relT: simT }; registerPass(g, { k: "throw", to: mate }); mate.ai.recv = { at: simT }; }; }
  }

  /* ---------- balón parado ---------- */
  function placeTeam(t, fn) { for (const p of team(t)) { const q = fn(p); if (!q) continue; p.x = q.x; p.y = q.y; p.h = p.mh = Math.atan2(ball.y - p.y, ball.x - p.x); p.v = 0; p.one = null; p.oneW = 0; p.down = 0; p.req = null; p.ai.run = null; p.ai.recv = null; p.dr.plan = null; p.kickLock = false; } }
  function startSet(type, t, x, y, indirect) {
    if (M.phase === "end") return;
    M.phase = "set"; M.owner = null; M.pass = null; charge = null;
    ball.vx = ball.vy = ball.vz = 0; ball.z = 0; ball.inNet = false; ball.hold = null; ball.wx = ball.wy = ball.wz = 0;
    ball.x = clamp(x, 0, L); ball.y = clamp(y, 0, W);
    gkS[0] = { mode: "idle" }; gkS[1] = { mode: "idle" };
    const atk = t, def = 1 - t, gd = opp(atk);
    // colocación general de los dos equipos
    for (const p of P) { const h = homePos(p); p.x = h.x; p.y = h.y; p.wall = false; } M.fkId = (M.fkId || 0) + 1;
    for (let tt = 0; tt < 2; tt++) { const g = GKP(tt); if (g) { g.x = own(tt) + M.dirOf[tt] * (STREET ? .8 : 1.5); g.y = W / 2; } }   // los porteros, siempre en su portería
    let taker = null;
    if (type === "kick") { ball.x = L / 2; ball.y = W / 2; placeTeam(0, p => p.gk ? null : ({ x: clamp(homePos(p).x, M.dirOf[0] > 0 ? 1 : L / 2 + 1, M.dirOf[0] > 0 ? L / 2 - 1 : L - 1), y: homePos(p).y })); placeTeam(1, p => p.gk ? null : ({ x: clamp(homePos(p).x, M.dirOf[1] > 0 ? 1 : L / 2 + 1, M.dirOf[1] > 0 ? L / 2 - 1 : L - 1), y: homePos(p).y }));
      taker = team(atk).find(q => q.cat === "fwd") || mid(atk); for (const p of team(def)) { const kr = STREET ? 3.4 : 9.6; if (Math.hypot(p.x - L / 2, p.y - W / 2) < kr - .1) { const a = Math.atan2(p.y - W / 2, p.x - L / 2); p.x = L / 2 + Math.cos(a) * kr; p.y = W / 2 + Math.sin(a) * kr; } } }
    else if (type === "corner") { taker = team(atk).filter(p => !p.gk).sort((a, b) => dist(a, ball) - dist(b, ball))[0];
      const spots = [[.955, -3], [.92, 0], [.94, 3], [.89, -6], [.88, 6], [.8, 0], [.975, 26.5]], dspots = [[.965, -2], [.955, 2], [.93, -1], [.93, 3], [.92, -4], [.9, 1], [.86, 0], [.75, -10]];
      let k = 0; placeTeam(atk, p => p.gk ? null : p === taker ? null : (k < spots.length ? (() => { const s = spots[k++]; return { x: fx(atk, s[0]), y: W / 2 + s[1] * (ball.y < W / 2 ? -1 : 1) }; })() : homePos(p)));
      k = 0; placeTeam(def, p => p.gk ? null : (k < dspots.length ? (() => { const s = dspots[k++]; return { x: fx(atk, s[0]), y: W / 2 + s[1] * (ball.y < W / 2 ? -1 : 1) }; })() : homePos(p))); TEAMS[atk].stats.co++; }
    else if (type === "throw") { taker = team(atk).filter(p => !p.gk).sort((a, b) => dist(a, ball) - dist(b, ball))[0]; }
    else if (type === "goalkick") { taker = GKP(atk); ball.x = own(atk) + M.dirOf[atk] * 5.5; ball.y = W / 2 + (y < W / 2 ? -4 : 4);
      placeTeam(def, p => p.gk ? null : { x: (prog(atk, homePos(p).x) < .18 ? fx(atk, .2) : homePos(p).x), y: homePos(p).y }); }
    else if (type === "fk") { taker = team(atk).filter(p => !p.gk).sort((a, b) => (a.st.sho - b.st.sho) * -.05 + dist(a, ball) * .1 - dist(b, ball) * .1)[0];
      const dG = Math.hypot(gd - ball.x, W / 2 - ball.y);
      for (const p of team(def)) { const fr = STREET ? 5 : 9.5; if (!p.gk && Math.hypot(p.x - ball.x, p.y - ball.y) < fr - .3) { const a = Math.atan2(p.y - ball.y, p.x - ball.x); p.x = ball.x + Math.cos(a) * fr; p.y = ball.y + Math.sin(a) * fr; } }
      if (dG < 34 && !indirect) { // barrera
        const a = Math.atan2(W / 2 - ball.y, gd - ball.x), n = STREET ? 1 : dG < 22 ? 4 : 3, wall = team(def).filter(p => !p.gk).sort((a2, b2) => dist(a2, ball) - dist(b2, ball)).slice(0, n);
        wall.forEach((p, i) => { const off = (i - (n - 1) / 2) * .62 + .3; const wd = STREET ? 4.5 : 9.15; p.x = ball.x + Math.cos(a) * wd - Math.sin(a) * off; p.y = ball.y + Math.sin(a) * wd + Math.cos(a) * off; p.h = p.mh = a + Math.PI; p.wall = true; }); M.wallP = wall; } }
    else if (type === "pen") { taker = M.so && M.so.taker && !M.so.taker.sent ? M.so.taker : team(atk).filter(p => !p.gk).sort((a, b) => b.st.sho - a.st.sho)[0]; ball.x = gd - M.dirOf[atk] * (STREET ? 6 : 11); ball.y = W / 2;
      for (const p of P) { if (p.gk || p === taker) continue; if (prog(atk, p.x) > .82) p.x = fx(atk, .8 - Math.random() * .05); } const g = GKP(def); g.x = gd; g.y = W / 2; }
    if (taker) { const tgt = type === "corner" || type === "throw" ? { x: L / 2, y: W / 2 } : { x: gd, y: W / 2 };
      const a = Math.atan2(tgt.y - ball.y, tgt.x - ball.x); taker.x = ball.x - Math.cos(a) * (type === "pen" ? 2.2 : .7); taker.y = ball.y - Math.sin(a) * (type === "pen" ? 2.2 : .7); taker.h = taker.mh = a;
      if (type === "throw") { taker.x = ball.x; taker.y = ball.y < W / 2 ? -.35 : W + .35; ball.y = ball.y < W / 2 ? 0 : W; taker.h = taker.mh = ball.y < W / 2 ? Math.PI / 2 : -Math.PI / 2; } }
    for (const p of P) { p.v = 0; p.one = null; p.oneW = 0; p.down = 0; p.req = null; p.kickLock = false; p.ai.run = null; p.ai.recv = null; p.dr.plan = null; p.x = clamp(p.x, -2, L + 2); p.y = clamp(p.y, -2, W + 2); if (!p.wall) p.h = p.mh = Math.atan2(ball.y - p.y, ball.x - p.x); }
    if (taker && type === "throw") { ball.hold = taker; ball.z = 0; startOne(taker, "ThrowIn", { t0: 0, ts: 1.15, end: 2.6, rootScale: 0, h0: taker.h, freezeAt: 1.32, fadeIn: .15 }); }
    if (type === "goalkick") { const g = GKP(atk); g.x = ball.x - M.dirOf[atk] * .7; g.y = ball.y; }
    M.set = { type, t: atk, taker, at: simT, indirect, done: false }; M.sets = M.sets || {}; M.sets[type] = (M.sets[type] || 0) + 1;
    if (taker && taker.t === M.humanTeam && !taker.gk) setHuman(taker); else if (R2 && taker && taker.t === R2.team && !taker.gk) R2.human = taker;
    const names = { kick: "SAQUE DE CENTRO", corner: "CÓRNER", throw: "SAQUE DE BANDA", goalkick: "SAQUE DE PUERTA", fk: indirect ? "FALTA (INDIRECTA)" : "FALTA", pen: "PENALTI" };
    msg(names[type] + (taker && taker.t === M.humanTeam && !taker.gk && type === "pen" ? "  ·  Stick: mueve la diana · mantén Espacio/B: potencia" : type === "pen" && (1 - atk) === M.humanTeam ? "  ·  Tu portero: apunta con el stick hacia dónde tirarse" : taker && taker.t === M.humanTeam && !taker.gk ? (type === "fk" && !indirect && Math.hypot(gd - ball.x, W / 2 - ball.y) < 35 ? "  ·  Stick: diana · Espacio/B: potencia · al tirar, stick = efecto" : type === "pen" || type === "fk" ? "  ·  Espacio/B tirar · J/A pasar" : "  ·  J/A sacar") : type === "goalkick" && atk === M.humanTeam ? "  ·  J/A en corto · L/X en largo" : ""), type === "kick" ? 2.2 : 1.8); camSnap = true;
    if (type !== "kick" && type !== "throw" && type !== "goalkick") whistle(1);
  }
  // ejecutar el balón parado: humano con los botones, IA tras una pausa
  function wallJump(p) { const wl = M.wallP || []; M.wallP = null; const fid = M.fkId; later(3, () => { if (M.fkId === fid) for (const w of wl) w.wall = false; }); const t0w = simT, jw = () => { if (!(M.shot && M.shot.p === p && M.shot.t > t0w)) { if (simT - t0w < 4) later(.04, jw); return; } for (const w of wl) if (!w.one && w.down <= 0 && dist(w, ball) < 12) startOne(w, "SoccerHeader", { ts: 1.7, t0: .95, end: 1.7, rootScale: 0, h0: w.h, fadeIn: .05 }); }; later(.1, jw); }
  // diana de las faltas y los penaltis (como en DLS)
  const aimMesh = new THREE.Mesh(new THREE.RingGeometry(.26, .36, 28), new THREE.MeshBasicMaterial({ color: 0xffd23a, transparent: true, opacity: .95, depthTest: false, side: THREE.DoubleSide })); aimMesh.renderOrder = 9; aimMesh.visible = false; S.add(aimMesh);
  function aimShow(t, a) { const gx = opp(t); aimMesh.position.copy(P3(gx, W / 2 + a.y, a.z)); aimMesh.rotation.set(0, Math.PI / 2, 0); aimMesh.visible = true; }
  function setPieceStep(I, dt) {
    const s = M.set; if (!s || M.phase !== "set") return;
    const p = s.taker, human = p.t === M.humanTeam && !p.gk && (!M.lockP || p === M.lockP), wait = simT - s.at, humanGK = s.type === "goalkick" && p.t === M.humanTeam && !M.lockP;
    if (s.type === "throw") { ball.hold = p; if (p.one && p.one.n === "ThrowIn" && p.one.t > .45) handsBall(p); }
    let go = null;
    if (human && wait > .4) {
      if (s.type === "pen" || s.type === "fk") {
        // como en DLS: con el stick mueves la diana de la portería, mantienes TIRO para la potencia y, al soltar, el stick le da efecto
        const aimOn = s.type === "pen" || (!s.indirect && Math.hypot(opp(p.t) - ball.x, W / 2 - ball.y) < 35);
        if (aimOn) { if (!s.aim) s.aim = s.type === "pen" ? { y: 0, z: .6 } : { y: (Math.sign(W / 2 - ball.y) || 1) * 2.2, z: 2.05 };
          if (I.dir != null && I.m > .2 && !(charge && charge.k !== "shot")) { const d = M.dirOf[p.t]; s.aim.y = clamp(s.aim.y + I.mx * d * 3.4 * dt, -(GW / 2 + 1.3), GW / 2 + 1.3); s.aim.z = clamp(s.aim.z - I.my * 1.8 * dt, .2, 2.5); }
          aimShow(p.t, s.aim); }
        if (I.shootD) charge = { k: "shot", p: 0 }; if (I.passD) charge = { k: "pass", p: 0 }; if (I.lobD) charge = { k: "lob", p: 0 };
        if (charge) { if (I.fin) charge.fin = true; charge.p = Math.min(1, charge.p + dt / 1.05); const held = charge.k === "shot" ? I.shoot : charge.k === "pass" ? I.pass : I.lob; if (!held) { go = { k: charge.k, p: charge.p, fin: charge.fin, dir: I.dir, my: I.my, mx: I.mx, aim: aimOn && charge.k === "shot" ? Object.assign({}, s.aim) : null }; charge = null; } }
        $("#pw").style.display = charge ? "block" : "none"; if (charge) $("#pw i").style.width = (charge.p * 100) + "%";
      } else if (I.passD || I.lobD || I.shootD || I.thruD) go = { k: I.lobD ? "lob" : I.thruD ? "thru" : "pass", p: .6, dir: I.dir, my: I.my, mx: I.mx };
    } else if (humanGK && wait > .5 && wait < 6) { if (I.passD || I.thruD) go = { k: "pass", dir: I.dir }; else if (I.lobD || I.shootD) go = { k: "lob", dir: I.dir }; }
    else if (!human && wait > (s.type === "kick" ? .9 : s.type === "throw" ? 1.9 : s.type === "goalkick" ? 1.6 : 1.4)) go = { ai: true };
    if (!go) return;
    M.phase = "play"; M.set = null; $("#pw").style.display = "none"; aimMesh.visible = false; if (s.type === "kick") whistle(1);
    const t = s.t, gx = opp(t);
    if (s.type === "throw") { const mate = go.ai ? bestMate(p, 25) || mid(t) : mateInDir(p, go.dir != null ? go.dir : p.h, 30) || bestMate(p, 25) || mid(t);
      const aim = Math.atan2(mate.y - p.y, mate.x - p.x); let o = p.one && p.one.n === "ThrowIn" ? p.one : startOne(p, "ThrowIn", { t0: 1.32, ts: 1.3, end: 2.6, rootScale: 0, h0: p.h });
      if (o) { o.freezeAt = null; o.ts = 1.3; o.turnTo = aim; o.turnT = o.t + .25; o.onT = 1.62; o.during = () => { if (!o.fired && o.t > .45) handsBall(p); };
        o.on = () => { ball.hold = null; M.throwT = simT; ball.y = clamp(ball.y, BR + .02, W - BR - .02); const lx = mate.x + Math.cos(mate.mh) * mate.v * .6, ly = mate.y + Math.sin(mate.mh) * mate.v * .6, d = Math.hypot(lx - ball.x, ly - ball.y), a = Math.atan2(ly - ball.y, lx - ball.x), sp = clamp(5 + d * .45, 6, 15), T = d / sp; ball.vx = Math.cos(a) * sp; ball.vy = Math.sin(a) * sp; ball.vz = (.6 - ball.z + .5 * G * T * T) / T; M.last = p; registerPass(p, { k: "throw", to: mate }); mate.ai.recv = { at: simT }; }; }
      return; }
    if (s.type === "goalkick") {   // en corto si hay un compañero libre; si no, en largo a un delantero sin marca
      const mates = team(t).filter(q => !q.gk && !q.sent), free = q => { const r = nearestTo(1 - t, q.x, q.y); return r ? Math.hypot(r.x - q.x, r.y - q.y) : 30; };
      let k = go.k || null, mate = go.dir != null && go.k ? mateInDir(p, go.dir, 75) : null;
      if (mate && !k) k = "pass";
      if (!mate) { const sh = mates.filter(q => dist(q, p) < (STREET ? 14 : 30) && free(q) > (STREET ? 5 : 11) && prog(t, q.x) < .45).sort((a, b) => free(b) - free(a))[0];
        if (sh && k !== "lob" && (k === "pass" || Math.random() < .55)) { mate = sh; k = "pass"; }
        else { mate = mates.filter(q => prog(t, q.x) > (STREET ? .35 : .45)).sort((a, b) => (free(b) + prog(t, b.x) * 10) - (free(a) + prog(t, a.x) * 10))[0] || mates[0]; k = "lob"; } }
      if (k === "pass" && dist(mate, p) > (STREET ? 16 : 32)) k = "lob";
      passTo(p, mate, k, k === "lob" ? .95 : .6); return; }
    if (s.type === "pen") { M.penT = simT;
      // como en DLS: el stick marca el sitio (suelto = al centro) y la potencia la altura; a tope te arriesgas a mandarla arriba
      let side, hgt; const pw = go.ai ? .45 + Math.random() * .4 : (go.p || .5);
      if (go.ai) { side = Math.random() < .14 ? 0 : (Math.random() < .5 ? -1 : 1) * (.55 + Math.random() * .45); hgt = .2 + Math.random() * 1.5; }
      else if (go.aim) { side = Math.abs(go.aim.y) < .5 ? 0 : go.aim.y / (GW / 2 - .45); hgt = go.aim.z + (pw > .86 ? (pw - .86) * 7 : 0); }   // diana: la potencia a tope la sube
      else { const sy = go.dir != null ? clamp((go.mx || 0) * M.dirOf[t] / .85, -1, 1) : 0; side = Math.abs(sy) < .18 ? 0 : sy; hgt = pw < .35 ? .25 : pw < .7 ? .25 + (pw - .35) * 3 : pw < .93 ? 1.3 + (pw - .7) * 3.4 : 2.1 + (pw - .93) * 9; }
      requestKick(p, { k: "shot", pen: true, p: .55 + pw * .4, tx: gx + M.dirOf[t] * .2, ty: go.aim ? W / 2 + go.aim.y : W / 2 + side * (GW / 2 - .45), tz: hgt });
      // portero: si es tuyo, se tira hacia donde apuntes con el stick (suelto = se queda en el centro); la máquina adivina (35 %)
      const sd = Math.sign(side) || (Math.random() < .5 ? -1 : 1), hd = (1 - t) === M.humanTeam && !M.lockP;
      later(.3, () => { const gy = hd ? (lastI.dir != null && Math.abs(lastI.mx) > .3 ? Math.sign(lastI.mx * M.dirOf[t]) : 0) : (Math.random() < .35 ? sd : -sd); gkS[1 - t] = { mode: "dive", react: 0, t: .3, by: W / 2 + gy * 2.4, bz: hgt, pen: true, ws: gy !== 0 && gy === Math.sign(side) && Math.abs(side) < .92 && hgt < 2 ? Math.random() < .7 : gy === 0 && side === 0 }; });
      return; }
    if (s.type === "fk") { const dG = Math.hypot(gx - ball.x, W / 2 - ball.y);
      if (go.aim) { requestKick(p, { k: "shot", fk: true, p: go.p, tx: gx + M.dirOf[t] * .2, ty: W / 2 + go.aim.y, tz: go.aim.z + (go.p > .85 ? (go.p - .85) * 6 : 0) }); wallJump(p); return; }
      else if (!s.indirect && ((go.ai && dG < 30 && Math.random() < .7) || go.k === "shot")) { const behind = dG < 35, side = go.ai ? (Math.random() < .5 ? -1 : 1) : (go.dir != null && Math.abs(behind ? go.mx : go.my) > .25 ? Math.sign(behind ? go.mx * M.dirOf[t] : go.my) : (Math.random() < .5 ? -1 : 1));
        requestKick(p, { k: "shot", fin: true, p: go.ai ? .6 + Math.random() * .2 : go.p, tx: gx + M.dirOf[t] * .2, ty: W / 2 + side * (GW / 2 - .45), tz: 1.6 + Math.random() * .5 });
        wallJump(p); return; } }
    // pase o centro (córner, falta lejana, saque de centro)
    if (s.type === "corner" || (s.type === "fk" && (go.k === "lob" || go.ai))) { const tgts = team(t).filter(q => q !== p && !q.gk && prog(t, q.x) > .78).sort(() => Math.random() - .5);
      const sh = s.type === "corner" ? team(t).find(q => q !== p && !q.gk && dist(q, p) < 11) : null;
      if (sh && go.ai && Math.random() < .25) { passTo(p, sh, "pass", .45); return; }
      const q = go.ai ? tgts[0] : (go.dir != null ? mateInDir(p, go.dir, 60) : null) || tgts[0];
      if (q) { passTo(p, q, "cross", .75); for (const a of tgts) a.ai.run = { x: lerp(a.x, fx(t, .94), .5), y: lerp(a.y, W / 2, .4), until: simT + 1.6 }; return; } }
    const mate = go.ai ? bestMate(p, 30) : (go.dir != null ? mateInDir(p, go.dir, 40) : null) || bestMate(p, 30);
    if (mate) passTo(p, mate, go.k === "thru" ? "thru" : go.k === "lob" ? "lob" : "pass", .55); else requestKick(p, { k: "pass", p: .5, tx: p.x + M.dirOf[t] * 10, ty: p.y });
  }
  // el balón sale del campo
  function outOfPlay() {
    if (DR) { if (!ball.inNet && (ball.x < -BR || ball.x > L + BR || ball.y < -BR || ball.y > W + BR)) drOut(); return; }
    if (STREET || M.so || M.phase !== "play" || ball.hold || ball.inNet) return;
    const lt = M.last ? M.last.t : 0;
    if (M.throwT && simT - M.throwT < .5) return;   // el balón acaba de salir de las manos en el saque de banda: aún no cuenta como fuera
    if (ball.y < -BR || ball.y > W + BR) { M.phase = "stop"; const x = ball.x, y = ball.y < 0 ? 0 : W; later(0.7, () => startSet("throw", 1 - lt, clamp(x, 1, L - 1), y)); return; }
    if (ball.x < -BR || ball.x > L + BR) { if (Math.abs(ball.y - W / 2) < GW / 2 && ball.z < GH) return;
      M.phase = "stop"; const endX = ball.x < 0 ? 0 : L, y = ball.y, defT = own(0) === endX ? 0 : 1;
      if (lt === defT) later(0.8, () => startSet("corner", 1 - defT, endX, y < W / 2 ? 0 : W)); else later(0.8, () => startSet("goalkick", defT, endX, y)); }
  }

  /* ---------- goles, reloj y partido ---------- */
  function goalScored(side) { if (DR) { drGoal(side); return; } M.crowdEx = 1; if (M.so) { M.phase = "stop"; netSnd(); soResult(true); return; } M.evH++; if (M.shotLog && M.shotLog.length) M.shotLog[M.shotLog.length - 1].goal = true;
    const t = own(0) === (side ? L : 0) ? 1 : 0; TEAMS[t].score++; M.goalT = simT; M.goalTeam = t; M.phase = "stop"; M.owner = null;
    const sc = M.last && M.last.t === t ? M.last : null, mins = curMin();
    M.goals.push({ m: Math.max(1, mins), s: t, sc: sc ? sc.name : (M.last ? M.last.name + " (p.p.)" : "—"), as: sc && M.assist && M.assist !== sc && M.assist.t === t ? M.assist.name : null, u: sc ? sc.u : null }); msg("¡GOOOL!", 2.4); later(1.2, () => tvGoal(t, sc ? sc.name : (M.last ? M.last.name + " (p.p.)" : "—"), Math.max(1, mins))); netSnd(); later(.12, () => SND.gol ? play("gol", .9) : applause(4, 1.4)); later(SND.gol ? 9 : 2.5, chant); updHud(); try { $("#sb").animate([{ transform: "scale(1)" }, { transform: "scale(1.18)", filter: "brightness(1.6)" }, { transform: "scale(1)" }], { duration: 900, iterations: 2 }); } catch (e) {}
    // celebración: el goleador corre hacia la esquina y se desliza de rodillas; los compañeros van a abrazarle
    { const gk = P.find(q => q.gk && q.t === 1 - t); if (gk) later(.7, () => { if (!gk.one && M.phase !== "play") startOne(gk, "GoalkeeperMiss", { ts: 1, rootScale: 0, fadeIn: .3, end: 2.7, h0: gk.h }); }); }
    if (sc) { const cx = side ? L - 4 : 4, cy = sc.y < W / 2 ? 3 : W - 3; M.celeb = { sc, t, x: cx, y: cy, at: simT }; }
    M.goalAt = simT; later(4.6, () => { M.celeb = null; startReplay(side, () => startSet("kick", 1 - t)); });
  }
  function updHud() { const rc = t => (M.cards || []).filter(c => c.s === t && c.c === "R").length, chip = t => `<i style="display:inline-block;width:5px;height:18px;vertical-align:-4px;margin:0 6px;background:${TEAMS[t].kit[0]};border-radius:2px"></i>`, red = t => rc(t) ? `<i style="display:inline-block;width:8px;height:11px;margin:0 3px;background:#e11d2e;border-radius:1px;vertical-align:0"></i>`.repeat(rc(t)) : "";
    $("#score").innerHTML = `${chip(0)}${TEAMS[0].short}${red(0)} <b style="margin:0 8px;font-size:18px">${TEAMS[0].score} - ${TEAMS[1].score}</b> ${red(1)}${TEAMS[1].short}${chip(1)}`;
    const kc = t => `<i class="kc" style="background:${TEAMS[t].kit[0]}"></i>`, rcs = t => '<i class="rc"></i>'.repeat(rc(t));
    if ($("#sbn0")) { $("#sbn0").innerHTML = kc(0) + TEAMS[0].short + rcs(0); $("#sbn1").innerHTML = kc(1) + TEAMS[1].short + rcs(1); $("#sbs0").textContent = TEAMS[0].score; $("#sbs1").textContent = TEAMS[1].score; } vbUpd(); }
  let vbK = ""; function vbUpd() { if (!window.__vb) return; const h = M.half > 2 ? "PRÓRROGA" : M.half + "ª PARTE", k = [TEAMS[0].short, TEAMS[1].short, TEAMS[0].score, TEAMS[1].score, $("#clock").textContent, h].join("|"); if (k !== vbK) { vbK = k; window.__vb(TEAMS[0].short, TEAMS[1].short, TEAMS[0].score, TEAMS[1].score, $("#clock").textContent, h, TEAMS[0].kit[0], TEAMS[1].kit[0]); } }
  /* ---------- radar y jugador controlado (nombre + energía) ---------- */
  const radar = document.createElement("canvas"); radar.width = 230; radar.height = 150; Object.assign(radar.style, { position: "fixed", left: "50%", bottom: "12px", transform: "translateX(-50%)", width: "196px", height: "128px", opacity: .82, pointerEvents: "none" }); document.body.appendChild(radar); if (TS.on) Object.assign(radar.style, { bottom: "auto", top: "10px", width: "170px", height: "111px" });
  const tag = document.createElement("div"); Object.assign(tag.style, { position: "fixed", left: 0, top: 0, pointerEvents: "none", textAlign: "center", fontWeight: 800, fontSize: "12px", textShadow: "0 1px 3px #000", whiteSpace: "nowrap", transform: "translate(-50%,-100%)" }); document.body.appendChild(tag);
  tag.innerHTML = '<div id="tgN"></div><div style="width:46px;height:5px;margin:3px auto 0;background:#0008;border-radius:3px;overflow:hidden"><i id="tgE" style="display:block;height:100%;background:#3ddc84"></i></div>';
  const _pv = new THREE.Vector3();
  function hudFrame() {
    const g = radar.getContext("2d"), RW = 230, RH = 150, px = x => 8 + x / L * (RW - 16), py = y => 8 + y / W * (RH - 16);
    g.clearRect(0, 0, RW, RH); g.fillStyle = "rgba(10,30,15,.55)"; g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = 1; g.beginPath(); g.roundRect ? g.roundRect(1, 1, RW - 2, RH - 2, 8) : g.rect(1, 1, RW - 2, RH - 2); g.fill();
    g.strokeRect(px(0), py(0), px(L) - px(0), py(W) - py(0)); g.beginPath(); g.moveTo(px(L / 2), py(0)); g.lineTo(px(L / 2), py(W)); g.stroke(); g.beginPath(); g.arc(px(L / 2), py(W / 2), 9.15 / L * (RW - 16), 0, 7); g.stroke();
    g.strokeRect(px(0), py(W / 2 - 20.16), px(16.5) - px(0), py(W / 2 + 20.16) - py(W / 2 - 20.16)); g.strokeRect(px(L - 16.5), py(W / 2 - 20.16), px(L) - px(L - 16.5), py(W / 2 + 20.16) - py(W / 2 - 20.16));
    for (const p of P) { if (p.sent) continue; g.fillStyle = p.gk ? (p.t ? "#f59e0b" : "#16a34a") : TEAMS[p.t].kit[0]; g.beginPath(); g.arc(px(p.x), py(p.y), p === M.human ? 4.5 : 3.4, 0, 7); g.fill(); if (p === M.human) { g.strokeStyle = "#ffd23a"; g.lineWidth = 2; g.stroke(); g.lineWidth = 1; g.strokeStyle = "rgba(255,255,255,.55)"; } }
    g.fillStyle = "#fff"; g.beginPath(); g.arc(px(ball.x), py(ball.y), 2.6, 0, 7); g.fill();
    radar.style.display = M.replay || M.intro ? "none" : ""; if (aimMesh.visible && (!M.set || !M.set.aim || M.phase !== "set")) aimMesh.visible = false;
    const h = M.human; if (h && !M.replay && !M.intro && !h.sent) { _pv.copy(P3(h.x, h.y, 2.15)).project(cam); if (_pv.z < 1) { tag.style.display = ""; tag.style.left = ((_pv.x + 1) / 2 * innerWidth) + "px"; tag.style.top = ((1 - _pv.y) / 2 * innerHeight) + "px";
        { const pw = $("#pw"); if (pw.style.display === "block" && M.phase === "play") Object.assign(pw.style, { left: tag.style.left, top: (parseFloat(tag.style.top) - 44) + "px", bottom: "auto", width: "96px", height: "9px" }); else if (pw.style.top) Object.assign(pw.style, { left: "", top: "", bottom: "", width: "", height: "" }); }   // barra de potencia encima del jugador, como en DLS
        const n = h.name.split(" ").pop(); if (tag.dataset.n !== n) { tag.dataset.n = n; $("#tgN").textContent = (h.num ? h.num + " · " : "") + n; } const e = h.sta == null ? 1 : h.sta; $("#tgE").style.width = (e * 100) + "%"; $("#tgE").style.background = e > .5 ? "#3ddc84" : e > .25 ? "#ffd23a" : "#ff4d5e"; } else tag.style.display = "none"; } else tag.style.display = "none";
  }
  // partes: 1 y 2 (45'), 3 y 4 prórroga (15'); descuento al final de cada parte según goles, cambios y tarjetas
  const perLen = h => h <= 2 ? M.halfLen : M.halfLen / 3, perBase = h => [0, 0, 45, 90, 105][h], perMin = h => h <= 2 ? 45 : 15;
  function curMin() { const len = perLen(M.half), m = Math.min(M.clock, len) / len * perMin(M.half) + perBase(M.half); return Math.max(1, Math.round(m)); }
  M.addMin = 0; M.evH = 0;
  /* ---------- rótulos de televisión: goleador y estadísticas del descanso ---------- */
  const TV = document.createElement("div"); Object.assign(TV.style, { position: "fixed", left: "16px", top: "58px", transform: "translate(-30px, 0)", opacity: 0, transition: "opacity .35s, transform .35s", pointerEvents: "none", zIndex: 5, font: "700 15px system-ui", color: "#fff", maxWidth: "calc(100% - 32px)" }); document.body.appendChild(TV);
  let tvT = 0; function tvShow(html, dur, center) { if (NET && NET.host && NET.peer) NET.ev.push(["tv", html, dur, center]); TV.innerHTML = html; Object.assign(TV.style, center ? { left: "50%", top: "36%" } : { left: "16px", top: "58px" }); TV.dataset.c = center ? 1 : ""; TV.style.opacity = 1; TV.style.transform = center ? "translate(-50%, 0)" : "translate(0, 0)"; tvT = dur; }
  function tvFrame(dt) { if (tvT > 0 && (tvT -= dt) <= 0) { TV.style.opacity = 0; TV.style.transform = TV.dataset.c ? "translate(-50%, -20px)" : "translate(-30px, 0)"; } }
  const tvCol = t => TEAMS[t].kit[0];
  function tvGoal(t, name, min) { tvShow(`<div style="display:flex;align-items:stretch;border-radius:6px;overflow:hidden;box-shadow:0 4px 18px #0009"><span style="background:#ffd23a;color:#111;padding:8px 12px;font-weight:900">GOL ${min}'</span><span style="background:${tvCol(t)};width:8px"></span><span style="background:#0b1220ee;padding:8px 14px">${name}</span><span style="background:#0b1220ee;padding:8px 12px;opacity:.75">${TEAMS[t].short}</span></div>`, 4.2); }
  function tvStats(title) { const A = TEAMS[0].stats, B = TEAMS[1].stats, tp = A.pos + B.pos || 1, pc = x => x.pa ? Math.round(x.pc / x.pa * 100) + "%" : "–";
    const row = (a, n, b) => `<tr><td style="text-align:right;padding:3px 14px;font-weight:800">${a}</td><td style="text-align:center;opacity:.75;padding:3px 10px">${n}</td><td style="padding:3px 14px;font-weight:800">${b}</td></tr>`;
    tvShow(`<div style="background:#0b1220ee;border-radius:8px;padding:10px 6px 8px;box-shadow:0 4px 18px #0009"><div style="text-align:center;font-weight:900;letter-spacing:.06em;margin-bottom:6px">${title}</div><table style="border-collapse:collapse;margin:0 auto">
      <tr><td style="text-align:right;padding:3px 14px"><span style="display:inline-block;width:10px;height:10px;background:${tvCol(0)};margin-right:6px"></span>${TEAMS[0].short} ${TEAMS[0].score}</td><td></td><td style="padding:3px 14px">${TEAMS[1].score} ${TEAMS[1].short}<span style="display:inline-block;width:10px;height:10px;background:${tvCol(1)};margin-left:6px"></span></td></tr>
      ${row(Math.round(A.pos / tp * 100) + "%", "Posesión", Math.round(B.pos / tp * 100) + "%")}${row(A.sh, "Tiros", B.sh)}${row(A.co, "Córners", B.co)}${row(A.fo, "Faltas", B.fo)}${row(pc(A), "Pases buenos", pc(B))}</table></div>`, 5.6, true); }
  function clockStep(dt) { tvFrame(dt); if (DR) { drStep(dt); $("#clock").textContent = "—"; { const he = $("#sbh"); if (he) he.textContent = "ENTRENO"; } return; }
    if (M.phase === "end" || M.so) return;
    if (M.phase === "play") M.clock += dt;
    const len = perLen(M.half), over = M.clock - len;
    if (over >= 0 && !M.addShown) { M.addShown = true; M.addMin = clamp(Math.round((M.half <= 2 ? 1 : 0) + M.evH * .5 + Math.random() * 1.6), M.half <= 2 ? 1 : 0, M.half <= 2 ? 6 : 3); if (M.addMin) msg("+" + M.addMin + "  minutos de descuento", 2); }
    const mins = Math.min(len, M.clock) / len * perMin(M.half) + perBase(M.half), extra = over > 0 ? Math.floor(over / (len / perMin(M.half))) + 1 : 0;
    $("#clock").textContent = String(Math.floor(mins)).padStart(2, "0") + (extra ? "+" + Math.min(extra, M.addMin || 1) : "") + "'"; { const hh = DR ? "ENTRENO" : M.half > 2 ? "PRÓRROGA" : M.half + "ª PARTE", he = $("#sbh"); if (he && he.textContent !== hh) he.textContent = hh; } vbUpd();
    if (over >= M.addMin * len / perMin(M.half) && M.phase === "play" && !(M.owner && prog(M.owner.t, M.owner.x) > .75 && over < (M.addMin + .5) * len / perMin(M.half))) {
      whistle(3); M.phase = "stop"; const draw = TEAMS[0].score === TEAMS[1].score, KO = EMB ? !!EMB.knockout : QS.get("ko") === "1";
      const next = (h, dir, kt, txt) => { msg(txt, 3); later(3.2, () => { M.half = h; M.clock = 0; M.addShown = false; M.addMin = 0; M.evH = 0; M.dirOf = dir; startSet("kick", kt); }); };
      if (M.half === 1) { tvStats("DESCANSO"); M.phase = "stop"; const nx = next; later(2.8, () => nx(2, [-1, 1], 1, "SEGUNDA PARTE")); }
      else if (M.half === 2 && KO && draw) next(3, [1, -1], 0, "PRÓRROGA");
      else if (M.half === 3) next(4, [-1, 1], 1, "DESCANSO DE LA PRÓRROGA");
      else if (M.half === 4 && draw) { msg("TANDA DE PENALTIS", 3); later(3.2, startShootout); }
      else { M.phase = "end"; showEnd(); }
    }
  }
  /* ---------- tanda de penaltis: 5 por equipo y después muerte súbita, siempre en la misma portería ---------- */
  function startShootout() { const ord = t => team(t).filter(p => !p.gk).sort((a, b) => b.st.sho - a.st.sho);
    M.so = { t: 0, k: [0, 0], g: [0, 0], log: [[], []], ord: [ord(0), ord(1)], goalX: L }; M.dirOf = [1, -1]; soNext(); }
  function soNext() { const S_ = M.so, t = S_.t; M.dirOf = t === 0 ? [1, -1] : [-1, 1];   // el que tira siempre ataca la portería de la derecha
    S_.taker = S_.ord[t][S_.k[t] % S_.ord[t].length]; S_.res = null; S_.kickAt = null; S_.waitT = 0; startSet("pen", t, L - 11, W / 2); updSO(); }
  function soResult(goal) { const S_ = M.so; if (!S_ || S_.res != null) return; S_.res = goal; const t = S_.t; S_.k[t]++; if (goal) S_.g[t]++; S_.log[t].push(goal); updSO(); msg(goal ? "¡GOL!" : "¡FALLA!", 1.4);
    const k = S_.k, g = S_.g, left = t2 => Math.max(0, 5 - k[t2]);
    let win = null; if (k[0] <= 5 && k[1] <= 5) { if (g[0] > g[1] + left(1)) win = 0; else if (g[1] > g[0] + left(0)) win = 1; } if (win == null && k[0] === k[1] && k[0] >= 5 && g[0] !== g[1]) win = g[0] > g[1] ? 0 : 1;
    later(2.2, () => { if (win != null) { M.pens = [g[0], g[1]]; M.so = null; M.phase = "end"; msg(TEAMS[win].name + " gana en los penaltis", 3); later(3, showEnd); } else { S_.t = 1 - t; soNext(); } }); }
  const soBox = document.createElement("div"); Object.assign(soBox.style, { position: "fixed", left: "50%", top: "56px", transform: "translateX(-50%)", background: "#0b1220e6", padding: "6px 14px", borderRadius: "8px", fontWeight: 800, display: "none", whiteSpace: "nowrap" }); document.body.appendChild(soBox);
  function updSO() { const S_ = M.so; if (!S_) { soBox.style.display = "none"; return; } soBox.style.display = "";
    const dots = t => { const a = S_.log[t].map(x => `<i style="display:inline-block;width:11px;height:11px;border-radius:50%;margin:0 2px;background:${x ? "#3ddc84" : "#ff4d5e"}"></i>`); while (a.length < 5) a.push('<i style="display:inline-block;width:11px;height:11px;border-radius:50%;margin:0 2px;border:2px solid #fff6;box-sizing:border-box"></i>'); return a.join(""); };
    soBox.innerHTML = `${TEAMS[0].short} ${dots(0)} <span style="margin:0 10px">${S_.g[0]} - ${S_.g[1]}</span> ${dots(1)} ${TEAMS[1].short}`; }
  function soStep() { const S_ = M.so; if (!S_ || S_.res != null) return;
    if (M.phase === "play" && S_.kickAt == null && Math.hypot(ball.vx, ball.vy) > 4) S_.kickAt = simT;
    if (M.phase === "play" && S_.kickAt == null && (S_.waitT = (S_.waitT || 0) + 1) > 600) S_.kickAt = simT - 3;
    if (S_.kickAt != null) { const el = simT - S_.kickAt, gs = gkS[1 - S_.t];
      if (gs.mode === "hold" || el > 3.2 || (el > .6 && Math.hypot(ball.vx, ball.vy) < .8) || ball.x < L - 25 || ball.y < -1 || ball.y > W + 1 || (ball.x > L + .3 && !ball.inNet)) { M.phase = "stop"; soResult(false); } } }
  // online: cada jugador apunta su resultado en la clasificación (y en sus ligas de amigos)
  function netReport() { if (!NET || NET.rep || !NET.sala) return; NET.rep = true; let ses = null; try { ses = JSON.parse(localStorage.getItem("mdg27_ses") || "null"); } catch (e) {} if (!ses || !ses.tok) return;
    const me = NET.host ? 0 : 1, body = JSON.stringify({ tok: ses.tok, sala: NET.sala, gf: TEAMS[me].score, ga: TEAMS[1 - me].score });
    for (const u of [NET_SRV || NET_LIST[0], ...NET_LIST.filter(x => x !== NET_SRV)].slice(0, 2)) { fetch(u + "/cuenta/resultado", { method: "POST", headers: { "content-type": "application/json" }, body }).then(r => r.json()).then(j => { if (j && j.ok && !j.dup && j.r) msg("Clasificación online: " + j.r.pts + " puntos", 3); }).catch(() => {}); break; } }
  function showEnd() { if (NET) { netReport(); if (NET.host && NET.peer && !NET.ended) netSend({ t: "s", b: [ball.x, ball.y, ball.z], p: [], sc: [TEAMS[0].score, TEAMS[1].score], ck: $("#clock").textContent, ph: "end", h: [-1, -1], ex: 0, ev: NET.ev.splice(0).concat([["end"]]) }); NET.ended = true; }
    if (EMB && !EMB.net) { const s = TEAMS.map(t => t.stats); parent.postMessage({ type: "mdg27end", r: { track: { f: TRK.f, sc: TRK.ev, n: P.length, side: P.map(p => p.t), names: P.map(p => p.name || ""), kits: TEAMS.map(t => t.kit[0]), L, W }, score: [TEAMS[0].score, TEAMS[1].score], goals: M.goals, stats: s.map(x => ({ sh: x.sh, ont: x.ont, pos: x.pos, fo: x.fo, pa: x.pa, pc: x.pc, co: x.co, off: x.off })), cards: M.cards || [], pens: M.pens || null } }, "*"); return; } const s = TEAMS.map(t => t.stats), tot = s[0].pos + s[1].pos || 1;
    $("#end").innerHTML = `<h2>FINAL</h2><div class="es">${TEAMS[0].name} <b>${TEAMS[0].score} - ${TEAMS[1].score}</b> ${TEAMS[1].name}</div>${M.pens ? `<div>Penaltis: <b>${M.pens[0]} - ${M.pens[1]}</b></div>` : ""}
      <table><tr><td>${Math.round(s[0].pos / tot * 100)}%</td><th>Posesión</th><td>${Math.round(s[1].pos / tot * 100)}%</td></tr>
      ${[["sh", "Tiros"], ["ont", "A puerta"], ["pa", "Pases"], ["pc", "Pases completados"], ["co", "Córners"], ["fo", "Faltas"], ["off", "Fueras de juego"]].filter(([k]) => !STREET || (k !== "co" && k !== "off")).map(([k, n]) => `<tr><td>${s[0][k]}</td><th>${n}</th><td>${s[1][k]}</td></tr>`).join("")}</table>
      <button onclick="location.reload()">Jugar otra vez</button>${VOLVER ? `<button id="volv">${STREET ? "Volver al barrio" : "Volver al menú"}</button>` : ""}`; $("#end").style.display = "grid";
    if (VOLVER) $("#volv").onclick = () => { location.href = VOLVER + (STREET && !NET ? "?res=" + TEAMS[0].score + "-" + TEAMS[1].score : ""); }; }
  const VOLVER = (() => { const v = new URLSearchParams(location.search).get("volver"); return v && /^[\w.\/-]+\.html$/.test(v) ? v : null; })();

  /* ---------- separación entre jugadores ---------- */
  function separate() { for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) { const a = P[i], b = P[j]; const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy); if (d > 0 && d < .7) { const k = (.7 - d) / d * .5; a.x -= dx * k; a.y -= dy * k; b.x += dx * k; b.y += dy * k; } } }

  /* ---------- cámara de televisión ---------- */
  const camP = new THREE.Vector3(), camL = new THREE.Vector3(); let camSnap = true;
  function camera(dt) {
    const tx = STREET ? clamp(ball.x, 6, L - 6) : clamp(ball.x, 9, L - 9), ty = STREET ? clamp(ball.y, 5, W - 5) : clamp(ball.y, 8, W - 6);
    // faltas directas y penaltis: cámara detrás del balón, mirando a la portería
    const sp = DR && DR.k === "dianas" && !DR.shot && DR.state === "play" ? { t: 0 } : M.set && (M.set.type === "pen" || (M.set.type === "fk" && !M.set.indirect && Math.hypot(opp(M.set.t) - ball.x, W / 2 - ball.y) < 35)) ? M.set : null;
    if (sp) M.camBehind = { t: sp.t, until: 1e9 }; else if (M.camBehind && M.camBehind.until > 1e8) M.camBehind.until = simT + 1.6;
    if (M.camBehind && simT < M.camBehind.until) { const gx = opp(M.camBehind.t), a = Math.atan2(W / 2 - (M.camBehind.by || ball.y), gx - (M.camBehind.bx || ball.x));
      if (sp) { M.camBehind.bx = ball.x; M.camBehind.by = ball.y; }
      const bx = M.camBehind.bx, by = M.camBehind.by, w2 = P3(bx - Math.cos(a) * 10, by - Math.sin(a) * 10, 3.4), lk = P3(gx, W / 2, 1.1);
      if (camSnap) { camP.copy(w2); camL.copy(lk); camSnap = false; } camP.lerp(w2, Math.min(1, dt * 4)); camL.lerp(lk, Math.min(1, dt * 4)); cam.position.copy(camP); cam.lookAt(camL); sun.position.copy(P3(bx - 20, by - 25, 45)); sun.target.position.copy(P3(bx, by, 0)); return; }
    M.camBehind = null;
    // cámara de tele: fija en la banda, se aleja un poco si el balón viene cerca y hace zoom si se va lejos
    // cámara DLS (por defecto): más alta y más cerca, pegada al balón, como en Dream League Soccer
    if (!(M.camMode || 0) && !STREET && !window.CAMP && !window.CAMV && !window.CAMCLOSE) { const cy2 = Math.max(ty + 29, W / 2 + 35 + (ty - W / 2) * .45), want2 = P3(tx, cy2, 16.5), look2 = P3(tx, ty + 1, 0);
      const fv2 = clamp(14 + (cy2 - ty) * .42, 28, 34); M.fov = M.fov == null ? fv2 : lerp(M.fov, fv2, Math.min(1, dt * 1.5)); if (!M.intro && Math.abs(cam.fov - M.fov) > .01) { cam.fov = M.fov; cam.updateProjectionMatrix(); }
      if (camSnap) { camP.copy(want2); camL.copy(look2); camSnap = false; } camP.lerp(want2, Math.min(1, dt * 3)); camL.lerp(look2, Math.min(1, dt * 4)); cam.position.copy(camP); cam.lookAt(camL);
      sun.position.copy(P3(tx - 20, ty - 25, 45)); sun.target.position.copy(P3(tx, ty, 0)); return; }
    const cm = Math.max(0, (M.camMode || 0) - 1), cy = cm === 2 ? ty + 17 : STREET ? Math.max(ty + 17, W / 2 + 20 + (ty - W / 2) * .3) + (cm === 1 ? 5 : 0) : Math.max(ty + 31, W / 2 + 38 + (ty - W / 2) * .3) + (cm === 1 ? 8 : 0), want = P3(cm === 2 ? ball.x - M.dirOf[M.humanTeam >= 0 ? M.humanTeam : 0] * 6 : tx * .94 + L / 2 * .06, cy, cm === 2 ? 6.5 : cm === 1 ? (STREET ? 13 : 17) : (STREET ? 9.5 : 10.5)), look = P3(cm === 2 ? ball.x + M.dirOf[M.humanTeam >= 0 ? M.humanTeam : 0] * 4 : tx, ty + 1.2, 0); look.y = .9;
    const fv = cm === 2 ? 42 : STREET ? 38 : clamp(13 + (cy - ty) * .36, 24, 31); M.fov = M.fov == null ? fv : lerp(M.fov, fv, Math.min(1, dt * 1.5)); if (!M.intro && Math.abs(cam.fov - M.fov) > .01) { cam.fov = M.fov; cam.updateProjectionMatrix(); }
    if (window.CAMP) { cam.position.copy(P3(...window.CAMP.p)); cam.lookAt(P3(...window.CAMP.l)); return; }
    if (window.CAMV) { const v = window.CAMV, p = P[v.i]; cam.position.copy(P3(p.x + v.dx, p.y + v.dy, v.z)); cam.lookAt(P3(p.x, p.y, v.lz)); return; }
    if (window.CAMCLOSE && M.human) { const p = M.human; cam.position.copy(P3(p.x - 3, p.y + 6, 2.2)); cam.lookAt(P3(p.x, p.y, .9)); return; }
    if (camSnap) { camP.copy(want); camL.copy(look); camSnap = false; }
    camP.lerp(want, Math.min(1, dt * 2.2)); camL.lerp(look, Math.min(1, dt * 3)); cam.position.copy(camP); cam.lookAt(camL);
    sun.position.copy(P3(tx - 20, ty - 25, 45)); sun.target.position.copy(P3(tx, ty, 0));
  }
  // indicador del jugador controlado (anillo en el suelo)
  const ring = new THREE.Mesh(new THREE.RingGeometry(.42, .55, 32), new THREE.MeshBasicMaterial({ color: 0xffd23a, transparent: true, opacity: .9, depthWrite: false })); ring.rotation.x = -Math.PI / 2; S.add(ring);

  /* ---------- bucle ---------- */
  let dynS = 1, lowQ = 0, maxDpr = QUAL === "alta" ? 1.5 : QUAL === "media" ? 1.25 : (devicePixelRatio >= 2 ? 1 : .85), fpsN = 0, fpsT = 0, last = performance.now();
  /* ---------- repetición de los goles: se graban los últimos segundos (huesos, posiciones y balón) y se reproducen a cámara lenta ---------- */
  const ACT = P.concat(OFF); for (const a of ACT) { a.bones = []; a.inner.traverse(o => { if (o.isBone) a.bones.push(o); }); }
  /* ---------- banquillo y cambios (máximo 5); la IA cambia a los cansados en la segunda parte ---------- */
  const BN = [["Arenas", "Bueno", "Cordero", "Escobar", "Fuentes", "Galán", "Herrera"], ["Ekström", "Fofana", "Grünberg", "Ishikawa", "Kowalski", "Lindgren", "Novak"]];
  TEAMS.forEach((T, t) => { const src = EMB && EMB.teams[t].bench; T.bench = (src && src.length ? src : BN[t].map((n, i) => ({ n, role: i === 0 ? "POR" : ["DFC", "MC", "MC", "DC", "ED", "LI"][i - 1] }))).map((d, i) => Object.assign({ num: 12 + i, used: false }, d)); T.subs = 0; });
  async function doSub(outP, bi) {
    const T = TEAMS[outP.t], b = T.bench[bi]; if (!b || b.used || T.subs >= 5 || outP.sent) return false; const gkk = b.role === "POR";
    if (gkk !== !!outP.gk) return false; b.used = true; T.subs++;
    const usedM = new Set(P.filter(q => q.t === outP.t).map(q => q.model)), model = gkk ? "gn03" : (PJM.find(m => !usedM.has(m)) || PJM[(outP.i * 7 + T.subs) % PJM.length]);
    let a; try { a = await makeActor(model, gkk ? (outP.t ? ["#f59e0b", "#1f2937"] : ["#16a34a", "#111827"]) : T.kit, b.num, gkk ? 9 : T.des); } catch (e) { b.used = false; T.subs--; return false; }
    const r = () => 66 + Math.floor(Math.random() * 18), S0 = b.st, sv = (k, d) => S0 && S0[k] != null ? +S0[k] : d;
    const st = { pac: sv("pac", r()), acc: sv("pac", r()), agi: sv("dri", r()), dri: sv("dri", r()), sho: sv("sho", r()), pas: sv("pas", r()), def: sv("def", r()), phy: sv("phy", r()), gk: gkk ? (b.ov ? +b.ov : 78) : 40 };
    Object.assign(a, { t: outP.t, i: outP.i, role: outP.role, cat: outP.cat, fb: outP.fb, base: outP.base, gk: outP.gk, name: b.n, u: b.u || null, num: b.num, st, model, ai: { t: .3, run: null, tgt: null }, dr: { plan: null, lastT: -9, loose: 0, lastFoot: "R" }, down: 0, sta: 1,
      x: outP.t ? L / 2 + 2 : L / 2 - 2, y: -1.5, h: Math.PI / 2, mh: Math.PI / 2, yel: 0 });
    for (const n of WARM_L) { if (!META[n]) continue; const ac = a.act(n); if (ac) { ac.play(); ac.paused = true; ac.setEffectiveWeight(0); } }
    a.bones = []; a.inner.traverse(o => { if (o.isBone) a.bones.push(o); }); if (a.bones.length !== outP.bones.length) M.noReplay = true;
    const k = P.indexOf(outP); P[k] = a; ACT[ACT.indexOf(outP)] = a; outP.wrap.removeFromParent(); if (M.lockP === outP) { M.lockP = null; M.human = null; M.lockOut = true; } else if (EMB && EMB.lock && a.u === EMB.lock) { M.lockP = a; M.human = a; } if (M.human === outP) setHuman(a); if (M.owner === outP) M.owner = null;
    if (ball.hold === outP) ball.hold = a;
    msg("CAMBIO · entra " + b.n + " por " + outP.name, 2.2); return true; }
  function aiSubs() { if (DR || M.phase !== "set" || M.subBusy || M.so) return;
    for (let t = 0; t < 2; t++) { if (t === M.humanTeam && !M.lockP) continue; const T = TEAMS[t]; const inj = team(t).find(q => q.inj && !q.gk && q !== M.lockP); if (!inj && (M.half < 2 || M.clock < M.halfLen * .25 || T.subs >= 3)) continue; if (T.subs >= 5) continue;
      const tired = inj || team(t).filter(q => !q.gk && q !== M.lockP && (q.sta == null ? 1 : q.sta) < .5).sort((a, b) => a.sta - b.sta)[0]; const bi = T.bench.findIndex(b => !b.used && b.role !== "POR");
      if (tired && bi >= 0) { M.subBusy = true; doSub(tired, bi).finally(() => { M.subBusy = false; }); return; } } }
  const RS = ACT.reduce((n, a) => n + 6 + a.bones.length * 4 + 3, 0) + 8, RN = 540, RB = new Float32Array(RS * RN), RT = new Float64Array(RN); let rI = 0, rC = 0;
  function recFrame() { let o = rI * RS; RT[rI] = simT;
    for (const a of ACT) { const w = a.wrap; RB[o++] = w.position.x; RB[o++] = w.position.y; RB[o++] = w.position.z; RB[o++] = w.rotation.y; RB[o++] = a.inner.rotation.z; RB[o++] = w.visible ? 1 : 0;
      for (const b of a.bones) { const q = b.quaternion; RB[o++] = q.x; RB[o++] = q.y; RB[o++] = q.z; RB[o++] = q.w; } const hp = a.bones[0].position; RB[o++] = hp.x; RB[o++] = hp.y; RB[o++] = hp.z; }
    RB[o++] = ballMesh.position.x; RB[o++] = ballMesh.position.y; RB[o++] = ballMesh.position.z; const bq = ballMesh.quaternion; RB[o++] = bq.x; RB[o++] = bq.y; RB[o++] = bq.z; RB[o++] = bq.w;
    rI = (rI + 1) % RN; rC = Math.min(RN, rC + 1); }
  function applyFrame(k) { let o = k * RS;
    for (const a of ACT) { const w = a.wrap; w.position.set(RB[o], RB[o + 1], RB[o + 2]); w.rotation.set(0, RB[o + 3], 0, "YXZ"); a.inner.rotation.z = RB[o + 4]; w.visible = RB[o + 5] > .5; o += 6;
      for (const b of a.bones) { b.quaternion.set(RB[o], RB[o + 1], RB[o + 2], RB[o + 3]); o += 4; } a.bones[0].position.set(RB[o], RB[o + 1], RB[o + 2]); o += 3; }
    ballMesh.position.set(RB[o], RB[o + 1], RB[o + 2]); ballMesh.quaternion.set(RB[o + 3], RB[o + 4], RB[o + 5], RB[o + 6]); }
  const rpTag = document.createElement("div"); rpTag.textContent = "REPETICIÓN"; Object.assign(rpTag.style, { position: "fixed", right: "16px", top: "12px", padding: "6px 12px", background: "#d4142a", color: "#fff", fontWeight: 800, fontSize: "14px", borderRadius: "6px", letterSpacing: ".08em", display: "none" }); document.body.appendChild(rpTag);
  function startReplay(side, done) { if (NET) { done(); return; }
    // fotogramas guardados entre 4,5 s antes del gol y 1 s después
    const idx = []; for (let j = rC - 1; j >= 0; j--) { const k = (rI - 1 - j + RN) % RN; if (RT[k] >= M.goalAt - 4.5 && RT[k] <= M.goalAt + 1) idx.push(k); }
    if (idx.length < 20 || M.noReplay || window.STEP && window.NOREPLAY) { done(); return; }
    M.replay = { idx, t: 0, t0: RT[idx[0]], dur: RT[idx[idx.length - 1]] - RT[idx[0]], side, done, cam: null }; rpTag.style.display = "block"; ring.visible = false; $("#msg").style.opacity = 0;
  }
  function replayStep(dt) {
    const R = M.replay; if (R.t === 0) TS.tap = false; R.t += dt * .55; const I = input();
    if (R.t >= R.dur || (R.t > .6 && (I.shootD || I.passD || TS.tap))) { TS.tap = false; M.replay = null; rpTag.style.display = "none"; for (const a of ACT) a.wrap.visible = true; R.done(); return; }
    let k = 0; while (k < R.idx.length - 1 && RT[R.idx[k + 1]] - R.t0 <= R.t) k++; applyFrame(R.idx[k]);
    // cámara de repetición: a ras de césped desde la esquina de la portería, siguiendo el balón
    const gx = R.side ? L : 0, dOut = R.side ? 1 : -1, bx = ballMesh.position.x + L / 2, by = ballMesh.position.z + W / 2;
    // dos tomas: primero desde la banda a media altura, luego corte a ras de césped junto a la portería
    // tres tomas: banda a media altura, ras de césped junto al palo y, al final, detrás de la red
    const ang = R.t < R.dur * .42 ? 0 : R.t < R.dur * .72 ? 1 : 2; if (R.ang !== ang) { R.ang = ang; R.cam = null; }
    const want = ang === 0 ? P3(clamp(bx - dOut * 7, 2, L - 2), -7.5, 6.5) : ang === 1 ? P3(gx + dOut * 3.5, W / 2 + (by < W / 2 ? -11 : 11), 2.6) : P3(gx + dOut * 5.5, W / 2 + (by - W / 2) * .25, 3.4), look = new THREE.Vector3().copy(ballMesh.position); look.y = Math.max(.6, look.y);
    if (!R.cam) R.cam = { p: want.clone(), l: look.clone() }; R.cam.p.lerp(want, Math.min(1, dt * 1.5)); R.cam.l.lerp(look, Math.min(1, dt * 5)); cam.position.copy(R.cam.p); cam.lookAt(R.cam.l);
    if (CROWD) CROWD.U.uT.value += dt * .55;
  }
  function celebC(p, C) { const c = M.celeb, sc = c.sc, el = simT - c.at;
    if (p === sc) { const d = Math.hypot(c.x - p.x, c.y - p.y);
      if (!c.slid && (d < 6 || el > 2.4) && !p.one) { c.slid = true; startOne(p, "RunningSlide", { ts: 1, h0: p.h, fadeIn: .12, end: 1.45, after: () => startOne(p, ["Cheering", "Victory", "FistPump", "StandingFistPump", "KneelingPointing"][Math.floor(Math.random() * 5)], { ts: 1, end: 2.8, rootScale: 0, fadeIn: .2 }) }); }
      return c.slid ? { dir: null, m: 0 } : { dir: Math.atan2(c.y - p.y, c.x - p.x), m: 1, speed: 6.4 }; }
    if (p.t === c.t && !p.gk && !p.sent && el > .5) { const d = Math.hypot(sc.x - p.x, sc.y - p.y); if (d > 1.6 && d < 40) return { dir: Math.atan2(sc.y - p.y, sc.x - p.x), m: 1, speed: Math.min(6, 1 + d * .5) };
      if (d <= 1.6 && !p.one && Math.random() < .03) startOne(p, ["Clapping", "Rallying", "StandingCheering", "Excited", "FistPump"][Math.floor(Math.random() * 5)], { ts: 1, rootScale: 0, end: 2.2, fadeIn: .2 }); return { dir: null, m: 0, face: Math.atan2(sc.y - p.y, sc.x - p.x) }; }
    if (p.t !== c.t && !p.gk && !p.one && Math.random() < .004) startOne(p, "Disappointed", { ts: 1, rootScale: 0, fadeIn: .3 });
    return C; }
  /* ---------- presentación de televisión: vuelo de cámara sobre el estadio lleno antes del saque ---------- */
  const intro = document.createElement("div"); Object.assign(intro.style, { position: "fixed", left: 0, right: 0, bottom: "14%", textAlign: "center", fontWeight: 900, fontStyle: "italic", textShadow: "0 4px 18px #000", pointerEvents: "none", transition: "opacity .4s", opacity: 0 });
  intro.innerHTML = `<div style="font-size:clamp(26px,5vw,56px)">${TEAMS[0].name} <span style="color:#ffd23a">vs</span> ${TEAMS[1].name}</div><div style="font-size:14px;font-style:normal;font-weight:600;opacity:.8;margin-top:8px">Pulsa cualquier botón para empezar</div>`; document.body.appendChild(intro);
  M.intro = NET || DR ? null : { t: 0, dur: 7.5 };
  function introStep(dt) { const I = input(), R = M.intro; if (R.t === 0) TS.tap = false; R.t += dt; if (R.t > .3) intro.style.opacity = 1;
    if (window.STEP || R.t >= R.dur || (R.t > .5 && (TS.tap || I.shootD || I.passD || I.lobD || I.thruD || Object.values(K).some(Boolean)))) { TS.tap = false; M.intro = null; intro.style.opacity = 0; camSnap = true; later(9, () => { const hp = $("#help"); if (hp) hp.style.display = "none"; }); M.fov = null; cam.fov = 26; cam.updateProjectionMatrix(); whistle(1); if (M.msgT > 0) $("#msg").style.opacity = 1; return; }
    const u = R.t / R.dur, e = u * u * (3 - 2 * u), a = Math.PI * lerp(.9, .38, e), h = lerp(24, 12, e); $("#msg").style.opacity = 0;
    const ik = STREET ? .42 : 1; cam.position.set(Math.cos(a) * 50 * ik, h * (STREET ? .6 : 1), Math.sin(a) * lerp(22, 34, e) * ik + 2); cam.lookAt(lerp(-10, 0, e) * ik, lerp(9, 1, e) * ik, lerp(-30, 0, e) * ik); if (cam.fov !== 52) { cam.fov = 52; cam.updateProjectionMatrix(); }
    M.crowdEx = Math.max(M.crowdEx || 0, .35); if (CROWD) { CROWD.U.uT.value += dt; CROWD.U.uEx.value = M.crowdEx; const gk = M.goalTeam != null && simT - M.goalT < 14, e = M.crowdEx; CROWD.U.uExT.value.set(gk ? (M.goalTeam === 0 ? e : Math.min(e, .08)) : e, gk ? (M.goalTeam === 1 ? e : Math.min(e, .08)) : e); } crowdSound();
    for (const p of P) { pose(p, dt, p.gk ? GKT : FWD); place(p); } for (const a of OFF) { pose(a, dt, FWD); place(a); } }
  /* ---------- pausa (Esc / Start): reanudar, cámara, controles, salir ---------- */
  const pz = document.createElement("div"); Object.assign(pz.style, { position: "fixed", inset: 0, display: "none", placeItems: "center", alignContent: "center", gap: "10px", background: "radial-gradient(ellipse at center,#14213de6,#050a14f2)", zIndex: 20, textAlign: "center", backdropFilter: "blur(4px)", overflowY: "auto", padding: "16px 0" }); if (innerHeight < 560) pz.style.gridTemplateColumns = "repeat(2,auto)";
  const camNames = ["DLS", "Tele", "Tele alta", "Cercana"]; M.camMode = +(localStorage.getItem && (() => { try { return localStorage.getItem("mdg27cam2"); } catch (e) { return 0; } })()) || 0;
  const pzBtn = (t, f) => { const b = document.createElement("button"); b.textContent = t; Object.assign(b.style, { font: "800 18px 'Barlow Condensed',system-ui", letterSpacing: ".06em", textTransform: "uppercase", padding: "11px 28px", minWidth: "280px", borderRadius: "10px", border: "1px solid rgba(255,255,255,.14)", background: pz.children.length <= 1 ? "linear-gradient(180deg,#ffd86b,#f5c542)" : "rgba(20,32,58,.9)", color: pz.children.length <= 1 ? "#141414" : "#fff", cursor: "pointer" }); b.onclick = f; pz.appendChild(b); return b; };
  const pzT = document.createElement("h2"); pzT.textContent = "PAUSA"; Object.assign(pzT.style, { gridColumn: "1 / -1", margin: "0 0 10px", font: "italic 900 54px 'Barlow Condensed',system-ui", letterSpacing: ".04em" }); pz.appendChild(pzT);
  pzBtn("Reanudar", () => setPause(false)); const camB = pzBtn("", () => { M.camMode = (M.camMode + 1) % camNames.length; try { localStorage.setItem("mdg27cam2", M.camMode); } catch (e) {} camB.textContent = "Cámara: " + camNames[M.camMode]; }); camB.textContent = "Cámara: " + camNames[M.camMode];
  const MN = ["Defensiva", "Equilibrada", "Ofensiva", "Presión alta"], HT = () => M.humanTeam >= 0 ? M.humanTeam : 0;
  const tacB = pzBtn("", () => { const T = TEAMS[HT()]; T.ment = ((T.ment || 0) + 2) % 4 - 1; tacB.textContent = "Táctica: " + MN[(T.ment || 0) + 1]; }); tacB.textContent = "Táctica: Equilibrada";
  const subB = pzBtn("Cambios", () => openSubs());
  const QN = { alta: "Alta", media: "Media", baja: "Baja" }; let qNext = QUAL;
  const qB = pzBtn("Calidad: " + QN[QUAL], () => { qNext = qNext === "alta" ? "media" : qNext === "media" ? "baja" : "alta"; try { localStorage.setItem("mdg27q", qNext); } catch (e) {} qB.textContent = "Calidad: " + QN[qNext] + (qNext !== QUAL ? " (en el próximo partido)" : ""); });
  const realB = pzBtn("", () => { REAL = !REAL; try { localStorage.setItem("mdg27real", REAL ? "1" : "0"); } catch (e) {} realB.textContent = "Imagen: " + (REAL ? "Realista TV" : "Normal"); }); realB.textContent = "Imagen: " + (REAL ? "Realista TV" : "Normal");
  pzBtn("Configurar mando", () => startPadCfg());
  pzBtn("Controles", () => { const h = $("#help"); if (h) h.style.display = ""; });
  // panel de cambios: primero el que sale (con su energía), luego el que entra
  const sp = document.createElement("div"); Object.assign(sp.style, { position: "fixed", inset: 0, display: "none", placeItems: "center", alignContent: "center", background: "#050a14f2", zIndex: 21, gap: "10px", padding: "16px", overflow: "auto" }); document.body.appendChild(sp);
  function openSubs(sel) { const t = HT(), T = TEAMS[t]; sp.innerHTML = ""; sp.style.display = "grid";
    const h = document.createElement("h3"); h.textContent = sel ? "¿Quién entra por " + sel.name + "?" : `Cambios (${T.subs}/5) · elige quién sale`; Object.assign(h.style, { margin: "0 0 6px", fontSize: "22px" }); sp.appendChild(h);
    const grid = document.createElement("div"); Object.assign(grid.style, { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(210px,1fr))", gap: "8px", width: "min(900px,92vw)" }); sp.appendChild(grid);
    const item = (txt, sub, col, f, off) => { const b = document.createElement("button"); b.innerHTML = `<b>${txt}</b><br><small style="opacity:.8">${sub}</small>`; Object.assign(b.style, { font: "600 14px system-ui", padding: "10px", borderRadius: "8px", border: "0", background: off ? "#334155" : "#e2e8f0", color: off ? "#94a3b8" : "#111", cursor: off ? "default" : "pointer", textAlign: "left" }); if (!off) b.onclick = f; grid.appendChild(b); };
    if (!sel) { for (const q of P.filter(q => q.t === t && !q.sent)) { const e = Math.round((q.sta == null ? 1 : q.sta) * 100); item(`${q.num || ""} ${q.name}`, `${q.role} · energía ${e}%${q.inj ? " · lesionado" : ""}`, "", () => openSubs(q), T.subs >= 5); } }
    else { T.bench.forEach((b, i) => item(`${b.num} ${b.n}`, b.role + (b.used ? " · ya ha jugado" : ""), "", async () => { const ok = await doSub(sel, i); sp.style.display = "none"; subB.textContent = `Cambios (${T.subs}/5)`; if (!ok) msg("Ese cambio no se puede hacer", 1.5); }, b.used || (b.role === "POR") !== !!sel.gk)); }
    const back = document.createElement("button"); back.textContent = sel ? "Atrás" : "Cerrar"; Object.assign(back.style, { font: "800 16px system-ui", padding: "10px 24px", borderRadius: "8px", border: 0, background: "#ffd23a", cursor: "pointer", justifySelf: "center", marginTop: "6px" }); back.onclick = () => sel ? openSubs() : (sp.style.display = "none"); sp.appendChild(back); }
  if (!EMB) pzBtn("Entrenamiento libre", () => { location.href = "entrenamiento.html"; });
  pzBtn("Salir del partido", () => { if (window.mdgAsk) window.mdgAsk(); });
  document.body.appendChild(pz);
  // configurar mando: pulsar el botón que quieres para cada acción
  const PADCFG = { on: false }; const PCA = [["pass", "PASE"], ["shoot", "TIRO / ENTRADA"], ["through", "PASE AL HUECO"], ["lob", "CENTRO / SEGADA"], ["sprint", "ESPRINT"], ["skill", "TIRO CON ROSCA"], ["sw", "CAMBIAR JUGADOR"], ["jockey", "CUBRIR / TEMPORIZAR"], ["spin", "RULETA"], ["stop", "FRENAR BALÓN"], ["pause", "PAUSA"]];
  const pcBox = document.createElement("div"); Object.assign(pcBox.style, { position: "fixed", inset: 0, display: "none", placeItems: "center", alignContent: "center", gap: "14px", background: "#050a14f5", zIndex: 22, textAlign: "center", fontSize: "22px", padding: "16px" }); document.body.appendChild(pcBox);
  function startPadCfg() { let gp = null; try { gp = [...navigator.getGamepads()].find(q => q && q.connected); } catch (e) {}
    pcBox.style.display = "grid"; if (!gp) { pcBox.innerHTML = '<div>No se detecta ningún mando.<br><small>Conéctalo y pulsa un botón. Si el juego está dentro de la vista previa de Claude, ábrelo en Chrome (archivo MDG27.html).</small></div>'; const c = document.createElement("button"); c.textContent = "Cerrar"; Object.assign(c.style, { font: "800 16px system-ui", padding: "10px 24px", borderRadius: "8px", border: 0, background: "#ffd23a", justifySelf: "center" }); c.onclick = () => pcBox.style.display = "none"; pcBox.appendChild(c); return; }
    Object.assign(PADCFG, { on: true, id: gp.id, k: 0, map: {}, prev: gp.buttons.map(x => x.pressed), wait: performance.now() + 400 }); pcRender(); requestAnimationFrame(pcPoll); }
  function pcRender() { const a = PCA[PADCFG.k]; pcBox.innerHTML = `<div style="opacity:.7;font-size:15px">Configurar mando · ${PADCFG.k + 1}/${PCA.length}</div><div>Pulsa el botón para <b style="color:#ffd23a">${a[1]}</b></div><div style="opacity:.6;font-size:14px">Mueve el stick para saltar esta acción</div>`; }
  function pcPoll() { if (!PADCFG.on) return; let gp = null; try { gp = [...navigator.getGamepads()].find(q => q && q.connected && q.id === PADCFG.id); } catch (e) {}
    if (gp && performance.now() > PADCFG.wait) { const now = gp.buttons.map(x => x.pressed || x.value > .5), fresh = now.findIndex((v, i) => v && !PADCFG.prev[i]), skip = Math.hypot(gp.axes[0] || 0, gp.axes[1] || 0) > .8;
      if (fresh >= 0 || skip) { if (fresh >= 0) PADCFG.map[PCA[PADCFG.k][0]] = fresh; PADCFG.k++; PADCFG.wait = performance.now() + 350;
        if (PADCFG.k >= PCA.length) { PADMAPS[PADCFG.id] = PADCFG.map; try { localStorage.setItem("mdg27padmap", JSON.stringify(PADMAPS)); } catch (e) {} PADCFG.on = false; pcBox.innerHTML = "<div>Mando configurado</div>"; setTimeout(() => pcBox.style.display = "none", 1200); return; } pcRender(); }
      PADCFG.prev = now; }
    requestAnimationFrame(pcPoll); }
  // anfitrión: foto del partido ~15 veces por segundo (posiciones, animaciones, balón, marcador y eventos)
  function netSnap(dt) { NET.st = (NET.st || 0) + dt; if (NET.st < 1 / 15) return; NET.st = 0; const r = v => Math.round(v * 100) / 100;
    netSend({ t: "s", b: [r(ball.x), r(ball.y), r(ball.z)], p: P.map(p => [r(p.x), r(p.y), r(p.h), r(p.v), p.one ? p.one.n : 0, p.one ? r(p.one.t) : 0, p.one ? r(p.one.ts) : 0, p.wrap.visible ? 1 : 0]),
      sc: [TEAMS[0].score, TEAMS[1].score], ck: $("#clock").textContent, ph: M.phase, h: [P.indexOf(M.human), R2 ? P.indexOf(R2.human) : -1], ex: r(M.crowdEx || 0), ev: NET.ev.splice(0) }); }
  // invitado: no calcula el partido; manda sus botones y dibuja la última foto del anfitrión
  function guestTick(dt) { if (NET.ended && M.phase !== "end") { M.phase = "end"; showEnd(); } simT += dt; const I = input(); lastI = I; if (M.msgT > 0) { M.msgT -= dt; if (M.msgT <= 0) $("#msg").style.opacity = 0; }
    NET.it = (NET.it || 0) + dt; if (NET.it >= 1 / 30) { NET.it = 0; let b = 0; NETB.forEach((k, i) => { if (I[k]) b |= 1 << i; }); netSend({ t: "i", mx: Math.round((I.mx || 0) * 100) / 100, my: Math.round((I.my || 0) * 100) / 100, b }); }
    const S2 = NET.snap; if (S2) { NET.snap = null; NET.last = S2;
      if (TEAMS[0].score !== S2.sc[0] || TEAMS[1].score !== S2.sc[1]) { TEAMS[0].score = S2.sc[0]; TEAMS[1].score = S2.sc[1]; updHud(); } $("#clock").textContent = S2.ck; M.phase = S2.ph; M.crowdEx = S2.ex;
      M.human = P[S2.h[1]] || null;
      for (const e of S2.ev || []) { if (e[0] === "m") msg(e[1], e[2]); else if (e[0] === "s") play(e[1], e[2], e[3], e[4] || 0); else if (e[0] === "tv") tvShow(e[1], e[2], e[3]); else if (e[0] === "end") { M.phase = "end"; showEnd(); } }
      S2.p.forEach((q, i) => { const p = P[i]; if (!p) return; p.nx = q[0]; p.ny = q[1]; p.nh = q[2]; p.v = q[3]; p.wrap.visible = !!q[7];
        if (q[4]) { if (!p.one || p.one.n !== q[4] || Math.abs(p.one.t - q[5]) > .35) { p.one = null; startOne(p, q[4], { t0: q[5], ts: q[6] || 1, rootScale: 0, h0: q[2], fadeIn: .06, end: META[q[4]] ? META[q[4]].dur : 2 }); } } else if (p.one) { p.lastOne = p.one; p.one = null; } });
      NET.bt = [S2.b[0], S2.b[1], S2.b[2]]; }
    const k = Math.min(1, dt * 14);
    for (const p of P) { if (p.nx == null) continue; p.x += (p.nx - p.x) * k; p.y += (p.ny - p.y) * k; p.h += angD(p.h, p.nh) * k; p.mh = p.h; if (p.one) { p.one.t += dt * p.one.ts; if (p.one.t > p.one.end) { p.lastOne = p.one; p.one = null; } }
      pose(p, dt, p.gk ? GKT : FWD); place(p); }
    if (NET.bt) { const ox = ball.x, oy = ball.y; ball.x += (NET.bt[0] - ball.x) * k; ball.y += (NET.bt[1] - ball.y) * k; ball.z += (NET.bt[2] - ball.z) * k; ball.vx = (ball.x - ox) / Math.max(dt, 1e-3); ball.vy = (ball.y - oy) / Math.max(dt, 1e-3);
      ballMesh.position.copy(P3(ball.x, ball.y, ball.z + BR)); const bs = Math.hypot(ball.vx, ball.vy); if (bs > .05) ballMesh.rotateOnWorldAxis(new THREE.Vector3(ball.vy, 0, -ball.vx).normalize(), -bs * dt / BR); }
    if (M.human) { ring.visible = true; ring.position.copy(P3(M.human.x, M.human.y, .03)); } else ring.visible = false;
    if (TS.btn) { const def = !!(M.owner && M.owner.t !== M.humanTeam && M.phase === "play"); if (TS.def !== def) { TS.def = def; for (const [b, a, d] of TS.btn) b.textContent = def ? d : a; } }   // botones táctiles: cambian al defender
    crowdSound(); if (CROWD) { CROWD.U.uT.value += dt; CROWD.U.uEx.value = M.crowdEx; const gk = M.goalTeam != null && simT - M.goalT < 14, e = M.crowdEx; CROWD.U.uExT.value.set(gk ? (M.goalTeam === 0 ? e : Math.min(e, .08)) : e, gk ? (M.goalTeam === 1 ? e : Math.min(e, .08)) : e); } camera(dt); }
  function setPause(on) { M.paused = on && !NET; pz.style.display = on ? "grid" : "none"; if (!on) sp.style.display = "none"; subB.textContent = `Cambios (${TEAMS[HT()].subs}/5)`; try { if (AC) on ? AC.suspend() : AC.resume(); } catch (e) {} }
  addEventListener("keydown", e => { if (e.code === "Escape" || e.code === "KeyP") setPause(!M.paused); });
  let padStartPrev = false;
  /* ---------- CIUDAD DEPORTIVA: los 8 ejercicios del entrenamiento diario dentro del motor 3D ---------- */
  const DRN = { rondo4: "Rondo 4 contra 2", rondo5: "Rondo 5 contra 3", pases: "Pase preciso", dianas: "Tiro a dianas", eslalon: "Eslalon", faltas: "Faltas", sprint: "Sprint con balón", control: "Control orientado" };
  const drPanel = document.createElement("div"); Object.assign(drPanel.style, { position: "fixed", left: "50%", top: "10px", transform: "translateX(-50%)", background: "#0b1220e6", color: "#fff", borderRadius: "8px", padding: "6px 16px", font: "800 15px system-ui", textAlign: "center", zIndex: 6, display: DR ? "block" : "none", boxShadow: "0 3px 12px #0008", pointerEvents: "none" }); document.body.appendChild(drPanel);
  const OBJT = {}; async function objTex(n) { if (!OBJT[n]) OBJT[n] = loadTex("obj_" + n); return OBJT[n]; }
  async function dprop(n, x, y, h, o = {}) { const t = await objTex(n); let m;
    if (o.flat) { const a = t.image.width / t.image.height; m = new THREE.Mesh(new THREE.PlaneGeometry(h * a, h), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.copy(P3(x, y, .03)); }
    else { m = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true })); const a = t.image.width / t.image.height; m.scale.set(h * a, h, 1); m.position.copy(P3(x, y, (o.z || 0) + h / 2)); }
    S.add(m); DR.props.push(m); return m; }
  function drClear() { for (const m of DR.props) S.remove(m); DR.props = []; }
  function drMsg() { const n = DRN[DR.k] || DR.k, left = DR.time ? Math.max(0, Math.ceil(DR.time - DR.t)) : null;
    drPanel.innerHTML = `<div style="font-size:11px;letter-spacing:.12em;opacity:.75">ENTRENAMIENTO · ${n.toUpperCase()}</div><div style="font-size:22px">${DR.cnt} / ${DR.goalN}${DR.maxTries ? ` <span style="font-size:13px;opacity:.75">· intentos ${DR.tries}/${DR.maxTries}</span>` : ""}${left != null ? ` <span style="font-size:13px;opacity:.75">· ${left} s</span>` : ""}</div>`; }
  function drEnd(ok, why) { if (DR.state === "end") return; DR.state = "end"; msg(ok ? "¡COMPLETADO!" : "NO SUPERADO", 2.2); if (!ok && why) later(.9, () => msg(why, 1.6)); play(ok ? "gol" : "grada_grita", ok ? .5 : .3);
    later(2.4, () => { if (EMB && !EMB.net) parent.postMessage({ type: "mdg27end", r: { drill: { k: DR.k, ok: !!ok, why: why || "" }, score: [0, 0], goals: [], stats: [] } }, "*"); else { drPanel.innerHTML = ok ? "¡Ejercicio completado!" : "Inténtalo otra vez"; } }); }
  const dGo = (p, x, y, spr, face, C) => { const d = Math.hypot(x - p.x, y - p.y); if (d < .5) { C.dir = null; C.m = 0; if (face != null) C.face = face; return C; } C.dir = Math.atan2(y - p.y, x - p.x); C.m = d < 2 ? .5 : 1; C.spr = spr && d > 3; if (face != null && d < 3) C.face = face; return C; };
  function giveBall(p) { ball.x = p.x + Math.cos(p.h) * .45; ball.y = p.y + Math.sin(p.h) * .45; ball.z = 0; ball.vx = ball.vy = ball.vz = 0; ball.hold = null; ball.inNet = false; M.pass = null; M.owner = null; touchBy(p); if (p.t === 0) setHuman(p); }
  function park(p) { p.wrap.visible = false; p.x = -40; p.y = -40; p.v = 0; p.parked = true; }
  async function drSetup() {
    const T0 = team(0).filter(q => !q.gk), T1 = team(1).filter(q => !q.gk), cx = L / 2, cy = W / 2, gx = opp(0), dir = M.dirOf[0];
    M.intro = null; M.phase = "play"; M.set = null; M.owner = null; M.pass = null; DR.t = 0; if (CROWD) CROWD.im.visible = false;
    for (const a of OFF.splice(0)) a.wrap.visible = false;
    const keep = (list) => { for (const p of P.slice()) if (!p.gk && !list.includes(p)) { park(p); P.splice(P.indexOf(p), 1); } };
    const k = DR.k;
    if (k === "rondo4" || k === "rondo5") { const nA = k === "rondo4" ? 4 : 5, nD = k === "rondo4" ? 2 : 3, R = k === "rondo4" ? 8 : 9; DR.goalN = k === "rondo4" ? 8 : 10; DR.time = 120; DR.noGK = [0, 1];
      const A = T0.slice(0, nA), D = T1.slice(0, nD); keep(A.concat(D)); A.forEach((p, i) => { const a = i / nA * Math.PI * 2; DR.spots.set(p, { x: cx + Math.cos(a) * R, y: cy + Math.sin(a) * R * .9 }); p.x = DR.spots.get(p).x; p.y = DR.spots.get(p).y; p.h = p.mh = Math.atan2(cy - p.y, cx - p.x); });
      D.forEach((p, i) => { p.x = cx + (i - (nD - 1) / 2) * 1.5; p.y = cy; }); DR.A = A; DR.D = D; DR.R = R;
      for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; dprop("cono", cx + Math.cos(a) * (R + 2.5), cy + Math.sin(a) * (R + 2.5) * .9, .45); }
      giveBall(A[0]); }
    else if (k === "pases") { const m = T0.slice(0, 5); keep(m); DR.goalN = 8; DR.time = 100; DR.noGK = [0, 1]; DR.pivot = m[0]; M.lockP = m[0];   /* tú eres siempre el del centro */ m[0].x = cx; m[0].y = cy; DR.recv = m.slice(1);
      [[-12, -9], [12, -9], [-12, 9], [12, 9]].forEach((s, i) => { const p = DR.recv[i]; p.x = cx + s[0]; p.y = cy + s[1]; DR.spots.set(p, { x: p.x, y: p.y }); });
      DR.ring = await dprop("aro", cx, cy, 1.6, { flat: true }); drTarget(); giveBall(m[0]); }
    else if (k === "dianas") { const m = T0[0]; keep([m]); DR.goalN = 3; DR.maxTries = 10; DR.noGK = [0, 1]; DR.shooter = m;
      for (const s of [-1, 1]) dprop("diana", gx + dir * .05, cy + s * (GW / 2 - .75), .9, { z: .7 });
      drShotReset(); }
    else if (k === "eslalon") { const m = T0[0]; keep([m]); DR.goalN = 6; DR.time = 40; DR.noGK = [0, 1]; DR.gates = [];
      for (let i = 0; i < 6; i++) { const x = cx - dir * 20 + dir * i * 8, y = cy + (i % 2 ? 5 : -5); DR.gates.push({ x, y, ok: false }); dprop("pica", x, y - 1.6, 1.5); dprop("pica", x, y + 1.6, 1.5); }
      m.x = cx - dir * 28; m.y = cy; m.h = m.mh = dir > 0 ? 0 : Math.PI; giveBall(m); }
    else if (k === "faltas") { DR.goalN = 2; DR.maxTries = 8; DR.taker = T0[0]; keep(T0.slice(0, 1).concat(T1.slice(0, 4))); drFk(); }
    else if (k === "sprint") { const m = T0[0]; keep([m]); DR.goalN = 1; DR.time = 9; DR.noGK = [0, 1]; DR.t0 = null; m.x = cx - dir * 25; m.y = cy; m.h = m.mh = dir > 0 ? 0 : Math.PI; DR.fin = { x: cx + dir * 20, y: cy };
      dprop("porteria", DR.fin.x + dir * 1, cy, 1.1); dprop("escalera", m.x + dir * 3, cy + 2, .9, { flat: true }); for (const x of [-10, 0, 10]) for (const s of [-1, 1]) dprop("cono", cx + dir * x, cy + s * 3, .45); giveBall(m); }
    else if (k === "control") { const m = T0.slice(0, 2); keep(m); DR.goalN = 6; DR.noGK = [0, 1]; DR.me = m[0]; DR.mate = m[1]; M.lockP = m[0]; m[0].x = cx; m[0].y = cy; m[1].x = cx - dir * 15; m[1].y = cy; DR.spots.set(m[1], { x: m[1].x, y: m[1].y });
      DR.ring = await dprop("aro", cx, cy, 1.8, { flat: true }); drCtlNext(); }
    else if (k === "custom") { const sp = EMB.drillSpec || { items: [], start: [.3, .5], obj: "aros", goal: 1 }, X = u => dir > 0 ? u * L : L - u * L, Y = v => v * W;
      DRN.custom = sp.n || "Entreno personalizado";
      const cs = sp.items.filter(i => i.t === "comp"), ds = sp.items.filter(i => i.t === "def"), me = T0[0], mates = T0.slice(1, 1 + cs.length), Dd = T1.slice(0, ds.length);
      keep([me].concat(mates, Dd)); DR.noGK = sp.gk ? [0] : [0, 1]; M.lockP = me;
      DR.cu = { obj: sp.obj, start: { x: X(sp.start[0]), y: Y(sp.start[1]) }, gates: [], rings: [], minis: [], mates, defs: Dd, me };
      mates.forEach((p, i) => { const q = { x: X(cs[i].u), y: Y(cs[i].v) }; DR.spots.set(p, q); p.x = q.x; p.y = q.y; p.h = p.mh = Math.atan2(DR.cu.start.y - q.y, DR.cu.start.x - q.x); });
      Dd.forEach((p, i) => { const q = { x: X(ds[i].u), y: Y(ds[i].v) }; DR.spots.set(p, q); p.x = q.x; p.y = q.y; });
      for (const it of sp.items) { const x = X(it.u), y = Y(it.v);
        if (it.t === "puerta") { DR.cu.gates.push({ x, y, ok: false }); dprop("pica", x, y - 1.6, 1.5); dprop("pica", x, y + 1.6, 1.5); }
        else if (it.t === "aro") { const m = await dprop("aro", x, y, 1.8, { flat: true }); DR.cu.rings.push({ x, y, ok: false, m }); }
        else if (it.t === "cono") dprop("cono", x, y, .45);
        else if (it.t === "mini") { DR.cu.minis.push({ x, y }); dprop("porteria", x, y, 1.1); } }
      const auto = { puertas: DR.cu.gates.length, aros: DR.cu.rings.length, pases: 8, mini: 3, gol: 3 }[sp.obj] || 1;
      DR.goalN = Math.max(1, sp.goal || auto); if (sp.obj === "puertas") DR.goalN = Math.max(1, DR.cu.gates.length); if (sp.obj === "aros") DR.goalN = Math.min(DR.goalN, Math.max(1, DR.cu.rings.length));
      DR.time = sp.time || 0; DR.maxTries = sp.obj === "gol" || sp.obj === "mini" ? (sp.tries || 6) : 0; drCuReset(); }
    setHuman(team(0).find(q => !q.gk && !q.parked)); drMsg(); msg(String(DRN[k] || k).toUpperCase(), 1.8); { const sb = document.getElementById("sb"); if (sb) sb.style.display = "none"; }
  }
  function drCuReset() { const c = DR.cu, me = c.me, dir = M.dirOf[0]; me.x = c.start.x; me.y = c.start.y; me.h = me.mh = dir > 0 ? 0 : Math.PI; me.one = null; me.req = null;
    for (const p of c.mates.concat(c.defs)) { const q = DR.spots.get(p); p.x = q.x; p.y = q.y; p.v = 0; p.req = null; } DR.shot = false; giveBall(me); setHuman(me); }
  // rondo: tras robo o balón fuera, todos a su sitio, los defensores al centro y 1 segundo sin presión
  function drRondoReset() { const cx = L / 2, cy = W / 2; for (const p of DR.A) { const q = DR.spots.get(p); p.x = q.x; p.y = q.y; p.v = 0; p.one = null; p.req = null; p.h = p.mh = Math.atan2(cy - p.y, cx - p.x); }
    DR.D.forEach((p, i) => { p.x = cx + (i - (DR.D.length - 1) / 2) * 1.5; p.y = cy; p.v = 0; p.one = null; p.req = null; }); DR.grace = simT + 1.1; giveBall(DR.A[Math.floor(Math.random() * DR.A.length)]); }
  // compañero con la línea de pase más limpia
  function drOpenMate(p) { let b = null, bs = -1; for (const q of DR.A) { if (q === p) continue; const ax = q.x - p.x, ay = q.y - p.y, L2 = ax * ax + ay * ay || 1; let s = 99;
      for (const z of DR.D) { const t = clamp(((z.x - p.x) * ax + (z.y - p.y) * ay) / L2, 0, 1); s = Math.min(s, Math.hypot(p.x + ax * t - z.x, p.y + ay * t - z.y)); }
      s += Math.random() * .6; if (s > bs) { bs = s; b = q; } } return b; }
  function drTarget() { const c = DR.recv.filter(p => p !== DR.target); DR.target = c[Math.floor(Math.random() * c.length)]; DR.ring.position.copy(P3(DR.target.x, DR.target.y, .03)); }
  function drShotReset() { const m = DR.shooter, gx = opp(0), dir = M.dirOf[0], ys = [-6, 0, 6]; m.x = gx - dir * 22; m.y = W / 2 + ys[DR.tries % 3]; m.h = m.mh = Math.atan2(W / 2 - m.y, gx - m.x); m.one = null; m.req = null; DR.shot = false; giveBall(m); }
  function drFk() { const dir = M.dirOf[0]; DR.fkDone = false; DR.shot = false; startSet("fk", 0, opp(0) - dir * 21, W / 2 + (DR.tries % 2 ? 4 : -3)); }
  function drCtlNext() { DR.phase = "pass"; DR.recvAt = null; const a = Math.random() * Math.PI * 2; DR.ringAt = { x: clamp(L / 2 + Math.cos(a) * 6, 3, L - 3), y: clamp(W / 2 + Math.sin(a) * 6, 3, W - 3) }; DR.ring.position.copy(P3(DR.ringAt.x, DR.ringAt.y, .03));
    DR.me.x = L / 2; DR.me.y = W / 2; giveBall(DR.mate); setHuman(DR.me); later(1, () => { if (DR.state === "play" && M.owner === DR.mate) passTo(DR.mate, DR.me, "pass", .6); }); }
  // IA de los ejercicios: los compañeros guardan su sitio y la buscan si se queda suelta; los defensores del rondo presionan
  function drAI(p, dt, C) { const k = DR.k, sp = DR.spots.get(p);
    if (k === "custom" && p.t === 1 && sp) { const o = M.owner;
      if (o && o.t === 0 && Math.hypot(o.x - sp.x, o.y - sp.y) < 12) return dGo(p, o.x, o.y, true, null, C);
      if (!o && Math.hypot(ball.x - sp.x, ball.y - sp.y) < 10) { const ip = interceptPt(p); return dGo(p, ip.x, ip.y, true, null, C); }
      return dGo(p, sp.x, sp.y, false, Math.atan2(ball.y - p.y, ball.x - p.x), C); }
    if (k === "custom" && hasBall(p) && p !== DR.cu.me && p.t === 0) { if (!p.req && (p.drT = (p.drT || 0) + dt) > .6) { p.drT = 0; passTo(p, DR.cu.me, "pass", .5); } return dGo(p, p.x, p.y, false, null, C); }
    if ((k === "rondo4" || k === "rondo5") && p.t === 1) { const o = M.owner, i = DR.D.indexOf(p);
      if (DR.grace && simT < DR.grace) return dGo(p, L / 2 + (i - (DR.D.length - 1) / 2) * 1.5, W / 2, false, null, C);
      if (!o || o.t === 1) { const ip = interceptPt(p); return dGo(p, ip.x, ip.y, true, null, C); }
      if (i === 0) { dGo(p, o.x, o.y, dist(p, o) > 3.5, null, C); if (dist(p, o) < 2.5) C.m = .8; return C; }   // el que presiona no llega siempre a tope
      const mates = DR.A.filter(q => q !== o).sort((a, b) => dist(a, o) - dist(b, o)), tgt = mates[(i - 1) % mates.length];
        /* tapa la línea con retraso (reacciona a donde estaba el balón hace un momento) y sin llegar a ponerse justo en medio */
        p.lz = p.lz || { x: p.x, y: p.y }; const a = Math.min(1, dt * 1.6); p.lz.x += (lerp(o.x, tgt.x, .58) - p.lz.x) * a; p.lz.y += (lerp(o.y, tgt.y, .58) - p.lz.y) * a;
        dGo(p, p.lz.x, p.lz.y, false, null, C); C.m = Math.min(C.m || 1, .7); return C; }
    if (hasBall(p)) { if (k === "pases" && p !== DR.pivot && !p.req) { requestKick(p, { k: "pass", p: .5, tx: DR.pivot.x, ty: DR.pivot.y, to: DR.pivot }); }
      if ((k === "rondo4" || k === "rondo5") && !p.req && (p.drT = (p.drT || 0) + dt) > .7) { p.drT = 0; const m = drOpenMate(p); passTo(p, m, "pass", .5); }
      return dGo(p, p.x, p.y, false, null, C); }
    if (!M.owner && !ball.hold && sp && Math.hypot(ball.x - sp.x, ball.y - sp.y) < 6 && Math.hypot(ball.vx, ball.vy) < 6) { const ip = interceptPt(p); return dGo(p, ip.x, ip.y, true, null, C); }
    if (M.pass && M.pass.to === p) { const ip = interceptPt(p); return dGo(p, ip.x, ip.y, true, null, C); }
    if (sp) return dGo(p, sp.x, sp.y, false, Math.atan2(ball.y - p.y, ball.x - p.x), C);
    return C; }
  function drTouch(p) { if (!DR || DR.state !== "play") return; const k = DR.k, pa = M.pass;
    if (k === "rondo4" || k === "rondo5") { if (p.t === 1) { if (DR.cnt > 0) msg("¡Robo! Vuelta a empezar", 1.2); DR.cnt = 0; DR.steal = true; later(.8, () => { if (DR.state === "play") { DR.steal = false; drRondoReset(); } }); }
      else if (pa && pa.from && pa.from.t === 0 && pa.from !== p && !pa.drc) { pa.drc = 1; DR.cnt++; if (DR.cnt >= DR.goalN) drEnd(true); } drMsg(); }   /* cada pase cuenta una sola vez */
    if (k === "pases" && pa && pa.from === DR.pivot && p !== DR.pivot && !pa.drc) { pa.drc = 1; if (p === DR.target) { DR.cnt++; msg("¡Bien!", .8); if (DR.cnt >= DR.goalN) drEnd(true); else drTarget(); } else msg("Ese no era", .9); drMsg(); }
    if (k === "control" && p === DR.me && DR.phase === "pass") { DR.phase = "go"; DR.recvAt = simT; }
    if (k === "custom") { const c = DR.cu;
      if (p.t === 1 && !DR.wait) { msg("¡Te la han robado!", 1); drOut(); return; }
      if (c.obj === "pases" && pa && pa.from === c.me && p !== c.me && p.t === 0 && !pa.drc) { pa.drc = 1; DR.cnt++; msg("¡Bien!", .7); drMsg(); if (DR.cnt >= DR.goalN) drEnd(true); } } }
  function drOut() { if (DR.state !== "play" || DR.wait) return; const k = DR.k; DR.wait = true;
    later(.9, () => { DR.wait = false; if (DR.state !== "play") return;
      if (k === "rondo4" || k === "rondo5") { DR.cnt = 0; drMsg(); drRondoReset(); }
      else if (k === "pases") giveBall(DR.pivot);
      else if (k === "dianas") { DR.tries++; drMsg(); if (DR.tries >= DR.maxTries) drEnd(DR.cnt >= DR.goalN, "Te faltaron dianas"); else drShotReset(); }
      else if (k === "faltas") { DR.tries++; drMsg(); if (DR.tries >= DR.maxTries) drEnd(DR.cnt >= DR.goalN, "Te faltaron goles"); else drFk(); }
      else if (k === "eslalon" || k === "sprint") drEnd(false, "Se te escapó el balón");
      else if (k === "control") drCtlNext();
      else if (k === "custom") { const o = DR.cu.obj; if (o === "puertas") return drEnd(false, "Se te escapó el balón");
        if (DR.maxTries) { DR.tries++; drMsg(); if (DR.tries >= DR.maxTries) return drEnd(DR.cnt >= DR.goalN, "Te faltaron goles"); } drCuReset(); } }); }
  function drGoal(side) { const k = DR.k; if (DR.state !== "play") return;
    if (k === "dianas") { const near = Math.abs(ball.y - W / 2) > GW / 2 - 1.3; if (near) { DR.cnt++; msg("¡DIANA!", 1); } else msg("Gol, pero lejos del palo", 1); drMsg(); if (DR.cnt >= DR.goalN) return drEnd(true); }
    if (k === "faltas") { DR.cnt++; msg("¡GOL DE FALTA!", 1.2); drMsg(); if (DR.cnt >= DR.goalN) return drEnd(true); }
    if (k === "custom" && DR.cu.obj === "gol" && side === 0) { DR.cnt++; msg("¡GOL!", 1.1); drMsg(); if (DR.cnt >= DR.goalN) return drEnd(true); }
    drOut(); }
  function drStep(dt) { if (!DR || DR.state !== "play") return; DR.t += dt; const k = DR.k, dir = M.dirOf[0];
    if (DR.time && k !== "sprint" && DR.t > DR.time) return drEnd(false, "Se acabó el tiempo");
    if ((k === "rondo4" || k === "rondo5") && !DR.steal && Math.hypot(ball.x - L / 2, ball.y - W / 2) > DR.R + 5 && !DR.wait) { msg("Fuera del rondo", 1); drOut(); }
    if (k === "dianas" || k === "faltas") { const sh = M.shot && M.shot.t > (DR.lastShotT || -1); if (sh) { DR.lastShotT = M.shot.t; DR.shot = true; DR.shotT = simT; } if (DR.shot && simT - DR.shotT > 3.5 && !DR.wait) drOut(); if (k === "faltas" && DR.shot && M.owner && M.owner.t === 1 && !DR.wait) drOut(); }
    if (k === "eslalon") { const m = team(0).find(q => !q.gk && !q.parked), g = DR.gates.find(q => !q.ok); if (g && hasBall(m) && Math.abs(m.x - g.x) < .9 && Math.abs(m.y - g.y) < 1.5) { g.ok = true; DR.cnt++; play("toque", .6); drMsg(); if (DR.cnt >= DR.goalN) drEnd(true); } if (g && (m.x - g.x) * dir > 2) drEnd(false, "Te saltaste una puerta"); }
    if (k === "sprint") { const m = team(0).find(q => !q.gk && !q.parked); if (DR.t0 == null && m.v > 1) DR.t0 = DR.t; if (DR.t0 != null) { DR.time = 11; DR.tt = DR.t - DR.t0; if (DR.tt > 11) return drEnd(false, "Más de 11 segundos"); }
      if (hasBall(m) && (m.x - DR.fin.x) * dir > -1 && Math.abs(m.y - DR.fin.y) < 3) { DR.cnt = 1; drEnd(true); } }
    if (k === "control" && DR.phase === "go") { if (Math.hypot(DR.me.x - DR.ringAt.x, DR.me.y - DR.ringAt.y) < 1.4 && hasBall(DR.me)) { DR.cnt++; msg("¡Bien!", .8); drMsg(); if (DR.cnt >= DR.goalN) return drEnd(true); DR.phase = "wait"; later(.8, drCtlNext); }
      else if (simT - DR.recvAt > 3) { msg("Más rápido", .9); DR.phase = "wait"; later(.8, drCtlNext); } }
    if (k === "custom") { const c = DR.cu, me = c.me;
      if (c.obj === "gol" || c.obj === "mini") { const sh = M.shot && M.shot.t > (DR.lastShotT || -1); if (sh) { DR.lastShotT = M.shot.t; DR.shot = true; DR.shotT = simT; } if (DR.shot && simT - DR.shotT > 3.5 && !DR.wait) drOut(); }
      if (c.obj === "mini" && !DR.wait && !M.owner) for (const g of c.minis) if (Math.hypot(ball.x - g.x, ball.y - g.y) < 1.3 && Math.hypot(ball.vx, ball.vy) > 2.5) { DR.cnt++; msg("¡GOL!", 1); drMsg(); if (DR.cnt >= DR.goalN) return drEnd(true); drOut(); break; }
      if (c.obj === "puertas") { const g = c.gates.find(q => !q.ok); if (g && hasBall(me) && Math.abs(me.x - g.x) < .9 && Math.abs(me.y - g.y) < 1.5) { g.ok = true; DR.cnt++; play("toque", .6); drMsg(); if (DR.cnt >= DR.goalN) return drEnd(true); } }
      if (c.obj === "aros") for (const r of c.rings) if (!r.ok && hasBall(me) && Math.hypot(me.x - r.x, me.y - r.y) < 1.4) { r.ok = true; r.m.visible = false; DR.cnt++; play("toque", .6); msg("¡Bien!", .6); drMsg(); if (DR.cnt >= DR.goalN) return drEnd(true); } }
    if ((Math.floor(DR.t * 2) !== Math.floor((DR.t - dt) * 2))) drMsg(); }
  const TRK = { t: 0, f: [], ev: [] };
  function tick(dt) {
    { let gp = null; try { gp = navigator.getGamepads && [...navigator.getGamepads()].find(q => q && q.connected); } catch (e) {} const pi = gp ? padMapFor(gp).pause : 9, st = !!(gp && gp.buttons[pi] && gp.buttons[pi].pressed) && !PADCFG.on; if (st && !padStartPrev) setPause(!M.paused); padStartPrev = st; }
    if (M.paused) return;
    if (NET && NET.guest) { guestTick(dt); return; }
    if (NET && (!NET.ready || NET.ended)) { if (NET.ended && M.phase !== "end") { M.phase = "end"; showEnd(); } return; }
    if (M.intro) { introStep(dt); return; }
    if (M.replay) { replayStep(dt); return; }
    simT += dt;
    // grabación ligera del partido para revisar trampas: balón y 22 jugadores, 2 veces por segundo
    if (EMB && !DR && M.phase !== "end" && !M.replay && (TRK.t += dt) >= .5) { TRK.t = 0; if (TRK.f.length < 2400) { const fr = [Math.round(ball.x * 10), Math.round(ball.y * 10)]; for (const p of P) fr.push(Math.round(p.x * 10), Math.round(p.y * 10)); TRK.f.push(fr); TRK.ev.push(TEAMS[0].score * 100 + TEAMS[1].score); } }
    for (let i = TIMERS.length - 1; i >= 0; i--) if (TIMERS[i].at <= simT) { const f = TIMERS[i].fn; TIMERS.splice(i, 1); f(); }
    const I = input(); lastI = I; const I2 = R2 && NET.peer ? remoteInput() : null;
    if (M.aft) { M.aft.dt = dt; aftStep(I); }
    if (M.msgT > 0) { M.msgT -= dt; if (M.msgT <= 0) $("#msg").style.opacity = 0; }
    clockStep(dt);
    if (R2 && NET.peer && M.set && M.set.t === R2.team) withR2(() => setPieceStep(I2, dt)); else setPieceStep(I, dt);
    // controles: humano + IA
    const HC = M.phase === "play" ? humanControl(I, dt) : (humanControl(I, dt), { dir: null, m: 0 });
    gkRushIn(I, M.humanTeam); if (I2) gkRushIn(I2, R2.team);
    let HC2 = null; if (I2) { if (!R2.human) R2.human = team(1).find(q => !q.gk); HC2 = withR2(() => M.phase === "play" ? humanControl(I2, dt) : (humanControl(I2, dt), { dir: null, m: 0 })); }
    for (const p of P) {
      if (p.down > 0) p.down -= dt; if (p.dr.loose > 0) p.dr.loose -= dt;
      // recibir como en DLS: mientras sigas empujando el stick con el que diste el pase, el receptor va solo a por el balón; al soltarlo o moverlo a otro lado, vuelves a mandar tú
      if (p === M.human && M.pass && M.pass.to === p && !M.pass.free && (!lastI.dir || lastI.m < .35 || M.pass.stickH == null || Math.abs(angD(lastI.dir, M.pass.stickH)) > .9)) M.pass.free = simT - M.pass.at > .15 ? true : M.pass.free;
      const recvAuto = p === M.human && M.pass && M.pass.to === p && M.pass.t === p.t && (!lastI.dir || lastI.m < .35 || !M.pass.free) && !hasBall(p) || (DR && p === M.human && /rondo/.test(DR.k) && !hasBall(p) && (!lastI.dir || lastI.m < .2));   /* en el rondo, si no tocas el stick vuelves solo a tu sitio */
      let C = Object.assign({}, p === M.human && M.phase === "play" && !(M.set) && !recvAuto ? HC : HC2 && p === R2.human && M.phase === "play" && !M.set ? HC2 : (M.phase === "play" ? aiPlayer(p, dt) : { dir: null, m: 0 }));
      if (M.celeb && M.phase === "stop") C = celebC(p, C);
      if (p.sent) { C = p.y > -5 ? { dir: Math.atan2(-8 - p.y, L / 2 - p.x), m: 1, speed: 3.2 } : { dir: null, m: 0 }; if (p.y <= -5) p.wrap.visible = false; }
      // si ha pedido un golpeo y el balón aún no está a tiro, se acerca solo (carrerilla) mirando al objetivo
      if (p.req && !p.one && !p.gk && M.phase === "play") { const r = p.req, a = Math.atan2(r.ty - ball.y, r.tx - ball.x), tx = ball.x - Math.cos(a) * .8, ty = ball.y - Math.sin(a) * .8, d = Math.hypot(tx - p.x, ty - p.y);
        if (d > .5 && Math.hypot(ball.x - p.x, ball.y - p.y) > 1.1) { C.dir = Math.atan2(ty - p.y, tx - p.x); C.m = 1; C.speed = Math.min(4.6, 1.5 + d * 1.5); C.spr = false; } }
      p._C = C;
      if (!p.gk && !p.one && !hasBall(p) && p.v < 2.2 && C.dir != null && C.m > .5 && Math.abs(angD(p.h, C.dir)) > 2.5 && simT - (p.q180 || -9) > 2) { p.q180 = simT; const o = startOne(p, "Quick180Turn", { ts: 1.35, h0: p.h, end: 1.15, rootScale: 0, fadeIn: .08, turnTo: C.dir, turnT: 1 }); if (o) o.after = () => { p.mh = p.h; }; }
      if (!p.gk) { moveP(p, dt, C); stepOne(p, dt); }
      if (STREET && !p.sent && M.phase !== "stop") { p.x = clamp(p.x, .35, L - .35); p.y = clamp(p.y, .35, W - .35); }   // la jaula: nadie sale de la pista
      p.sta = clamp((p.sta == null ? 1 : p.sta) + (p.v > 6.2 ? -.045 : p.v > 4.5 ? -.004 : .03) * dt * (1.15 - (p.st.phy - 70) * .01), 0, 1);
    }
    aiMent(); soStep(); aiSubs(); advStep(); shoulderDuel(dt); backBattle(dt); if (M.pendCard && M.phase !== "play") { const f = M.pendCard; M.pendCard = null; f(); }
    if (M.phase === "play") {
      for (const p of P) if (p.req) tryKick(p);
      if (ball.z > 1.05 && ball.z < 2.8 && !ball.hold) aerial(I); else if (ball.z > .55 && !ball.hold && ball.vz < 2.5) volley(I);
      if (M.owner && !M.owner.gk) dribble(M.owner, dt, M.owner._C || {});
      updatePossession(dt);
      // cambio automático al defender: el más cercano al balón
      if (M.owner && M.owner.t !== M.humanTeam && M.human && dist(M.human, ball) > 6.5 && simT - (M.swT || 0) > .7) { const c = nearestTo(M.humanTeam, ball.x, ball.y); if (c && c !== M.human) { setHuman(c); M.swT = simT; } }
      if (!M.owner && M.human && !(M.pass && M.pass.t === M.humanTeam) && simT - (M.swT || 0) > .8) { const ch = (() => { let b = null, bt = 1e9; for (const p of team(M.humanTeam)) { if (p.gk) continue; const ip = interceptPt(p), tt = Math.hypot(ip.x - p.x, ip.y - p.y) / vSpr(p); if (tt < bt) { bt = tt; b = p; } } return b; })(); if (ch && ch !== M.human && dist(M.human, ball) > 6) { setHuman(ch); M.swT = simT; } }
      if (M.pass && M.pass.to && M.pass.to.t === M.humanTeam && simT - M.pass.at < .2) setHuman(M.pass.to);
      if (R2 && NET.peer) withR2(() => {
      // cambio automático al defender: el más cercano al balón
      if (M.owner && M.owner.t !== M.humanTeam && M.human && dist(M.human, ball) > 6.5 && simT - (M.swT || 0) > .7) { const c = nearestTo(M.humanTeam, ball.x, ball.y); if (c && c !== M.human) { setHuman(c); M.swT = simT; } }
      if (!M.owner && M.human && !(M.pass && M.pass.t === M.humanTeam) && simT - (M.swT || 0) > .8) { const ch = (() => { let b = null, bt = 1e9; for (const p of team(M.humanTeam)) { if (p.gk) continue; const ip = interceptPt(p), tt = Math.hypot(ip.x - p.x, ip.y - p.y) / vSpr(p); if (tt < bt) { bt = tt; b = p; } } return b; })(); if (ch && ch !== M.human && dist(M.human, ball) > 6) { setHuman(ch); M.swT = simT; } }
      if (M.pass && M.pass.to && M.pass.to.t === M.humanTeam && simT - M.pass.at < .2) setHuman(M.pass.to);
      });
    }
    separate();
    ballStep(ball, dt);
    outOfPlay();
    for (let t = 0; t < 2; t++) gkStep(t, dt);
    for (const p of P) { pose(p, dt, p.gk && !p.run ? GKT : p.inj && p.v < 2.6 ? INJ : p === M.human ? FWD : FWDS[p.i % 3]); place(p); }
    for (const a of OFF) { offStep(a, dt); pose(a, dt, FWD); place(a); if (a.cardT > simT) { flushPose(a); a.wrap.updateMatrixWorld(true); raiseArm(a); } }
    if (ball.hold && !(M.set && M.set.type === "throw")) { const g = ball.hold; if (g.gk && gkS[g.t].mode !== "throw") gkHands(g); }
    ballMesh.position.copy(P3(ball.x, ball.y, ball.z + BR));
    const bs = Math.hypot(ball.vx, ball.vy); if (bs > .05) ballMesh.rotateOnWorldAxis(new THREE.Vector3(ball.vy, 0, -ball.vx).normalize(), -bs * dt / BR);
    for (const n of nets) { if (!(n.hit > 0) && !n.dirty) continue; n.hit = Math.max(0, (n.hit || 0) - dt * 1.4); n.dirty = n.hit > 0; const hp = P3(n.hx || 0, n.hy || 0, n.hz || 0), ar = n.mesh.geometry.attributes.position, wp = n.wpos, amp = Math.sin(Math.min(1, n.hit) * Math.PI * .5) * (STREET ? .35 : .5) * n.sgn;
      for (let i = 0; i < ar.count; i++) { const dx = wp[i * 3] - hp.x, dy = wp[i * 3 + 1] - hp.y, dz = wp[i * 3 + 2] - hp.z, w = Math.exp(-(dx * dx + dy * dy + dz * dz) / .9); ar.array[i * 3 + 2] = n.base[i * 3 + 2] + w * amp; } ar.needsUpdate = true; }
    if (M.human) { ring.visible = true; ring.position.copy(P3(M.human.x, M.human.y, .03)); } else ring.visible = false;
    crowdSound(); if (M.phase === "play" && !window.STEP && Math.random() < dt / 40) chant();
    recQ = true;
    if (CROWD) { CROWD.U.uT.value += dt; M.crowdEx = Math.max(0, (M.crowdEx || 0) - dt * .09); CROWD.U.uEx.value = M.crowdEx; }
    camera(dt);
    if (NET && NET.host && NET.peer) netSnap(dt);
  }
  /* ---------- postproceso de televisión: brillo suave (bloom), tono de cine, color tipo retransmisión y viñeta ---------- */
  const PFOK = !window.NOPOST && Rn.capabilities.isWebGL2 && (Rn.extensions.has("EXT_color_buffer_half_float") || Rn.extensions.has("EXT_color_buffer_float"));
  // calidad baja: filtro ligero (color de televisión sin brillo ni suavizado extra) si el móvil tiene memoria; si luego va lento, se quita solo
  const PF = { on: PFOK && (QUAL !== "baja" || (navigator.deviceMemory || 4) >= 4), lite: QUAL === "baja" };
  if (PF.on) { try {
    const mk = (w, h, ms) => new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, samples: ms || 0, depthBuffer: !!ms });
    PF.blk = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1); PF.blk.needsUpdate = true;
    PF.main = mk(4, 4, PF.lite ? 4 : QUAL === "alta" ? 4 : 2); PF.a = mk(4, 4); PF.b = mk(4, 4);
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2)); PF.sc = new THREE.Scene(); PF.sc.add(quad); PF.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1); PF.quad = quad;
    const VS = "varying vec2 vU; void main(){ vU = uv; gl_Position = vec4(position.xy, 0., 1.); }";
    PF.bright = new THREE.ShaderMaterial({ uniforms: { t: { value: null } }, vertexShader: VS, depthTest: false,
      fragmentShader: "uniform sampler2D t; varying vec2 vU; void main(){ vec3 c = texture2D(t, vU).rgb; float l = dot(c, vec3(.2126,.7152,.0722)); gl_FragColor = vec4(c * smoothstep(.85, 1.6, l), 1.); }" });
    PF.blur = new THREE.ShaderMaterial({ uniforms: { t: { value: null }, d: { value: new THREE.Vector2() } }, vertexShader: VS, depthTest: false,
      fragmentShader: "uniform sampler2D t; uniform vec2 d; varying vec2 vU; void main(){ vec3 c = texture2D(t, vU).rgb * .227; c += (texture2D(t, vU + d).rgb + texture2D(t, vU - d).rgb) * .316; c += (texture2D(t, vU + d * 2.3).rgb + texture2D(t, vU - d * 2.3).rgb) * .07; gl_FragColor = vec4(c, 1.); }" });
    PF.comp = new THREE.ShaderMaterial({ uniforms: { t: { value: null }, bl: { value: null }, ex: { value: 1.05 }, real: { value: REAL ? 1 : 0 }, tm: { value: 0 }, px: { value: new THREE.Vector2(1 / 1280, 1 / 720) } }, vertexShader: VS, depthTest: false,
      fragmentShader: `uniform sampler2D t; uniform sampler2D bl; uniform float ex; uniform float real; uniform float tm; uniform vec2 px; varying vec2 vU;
        vec3 aces(vec3 x){ x *= ex * .6; return clamp((x * (2.51 * x + .03)) / (x * (2.43 * x + .59) + .14), 0., 1.); }
        vec3 toSRGB(vec3 c){ return mix(c * 12.92, 1.055 * pow(c, vec3(1. / 2.4)) - .055, step(.0031308, c)); }
        void main(){ vec3 b0 = texture2D(t, vU).rgb; vec2 q0 = vU - .5;
          if (real > .5) {   // filtro realista: aberración de lente en los bordes y nitidez tipo cámara de TV
            float ca = dot(q0, q0) * .006; b0 = vec3(texture2D(t, vU + q0 * ca).r, b0.g, texture2D(t, vU - q0 * ca).b);
            vec3 nb = (texture2D(t, vU + vec2(px.x, 0.)).rgb + texture2D(t, vU - vec2(px.x, 0.)).rgb + texture2D(t, vU + vec2(0., px.y)).rgb + texture2D(t, vU - vec2(0., px.y)).rgb) * .25;
            b0 += (b0 - nb) * .55; b0 = max(b0, 0.); }
          vec3 c = (b0 + texture2D(bl, vU).rgb * (real > .5 ? .22 : .35)) * (real > .5 ? 1.12 : 1.);
          c = aces(c);
          if (real > .5) { float lr = dot(c, vec3(.2126,.7152,.0722));
            c = mix(c, c * vec3(.93, 1.0, 1.09), (1. - smoothstep(0., .45, lr)) * .28);   // sombras frías
            c = mix(c, c * vec3(1.07, 1.01, .9), smoothstep(.5, 1., lr) * .35);          // luces cálidas
            c = mix(c, c * c * (3. - 2. * c), .3);                                      // curva de contraste fílmica
            c = mix(vec3(dot(c, vec3(.2126,.7152,.0722))), c, .9);
            float n = fract(sin(dot(vU * vec2(1280., 720.) + tm * 61.7, vec2(12.9898, 78.233))) * 43758.5453); c += (n - .5) * .03;   // grano de película
            c *= 1. - dot(q0, q0) * .3; }
          float l = dot(c, vec3(.2126,.7152,.0722)); c = mix(vec3(l), c, .9);            // un poco menos saturado (césped menos chillón)
          c = (c - .5) * 1.07 + .5; c *= vec3(1.03, 1.0, .96);                             // contraste y tono cálido de retransmisión
          vec2 q = vU - .5; c *= 1. - dot(q, q) * .42;                                      // viñeta suave
          gl_FragColor = vec4(toSRGB(clamp(c, 0., 1.)), 1.); }` });
  } catch (e) { console.warn("post", e); PF.on = false; } }
  function renderFrame() {
    if (!Rn.shadowMap.autoUpdate) Rn.shadowMap.needsUpdate = ((renderFrame.n = (renderFrame.n || 0) + 1) % 3) === 0;
    if (!PF.on) { Rn.render(S, cam); return; }
    const w = cv.width, h = cv.height; if (PF.main.width !== w || PF.main.height !== h) { PF.main.setSize(w, h); PF.a.setSize(w >> 2, h >> 2); PF.b.setSize(w >> 2, h >> 2); PF.comp.uniforms.px.value.set(1 / w, 1 / h); }
    PF.comp.uniforms.tm.value = (performance.now() / 1000) % 100; PF.comp.uniforms.real.value = REAL ? 1 : 0;
    const tm = Rn.toneMapping; Rn.setRenderTarget(PF.main); Rn.render(S, cam);
    const pass = (m, src, dst) => { PF.quad.material = m; m.uniforms.t.value = src.texture; Rn.setRenderTarget(dst); Rn.render(PF.sc, PF.cam); };
    if (!PF.lite) { pass(PF.bright, PF.main, PF.a); PF.blur.uniforms.d.value.set(1.5 / PF.a.width, 0); pass(PF.blur, PF.a, PF.b); PF.blur.uniforms.d.value.set(0, 1.5 / PF.a.height); pass(PF.blur, PF.b, PF.a); }
    PF.comp.uniforms.bl.value = PF.lite ? PF.blk : PF.a.texture; Rn.toneMapping = THREE.NoToneMapping; pass(PF.comp, PF.main, null); Rn.toneMapping = tm;
  }
  let recQ = false, lodF = 0;
  function draw(dt) {
    lodF++; for (const a of ACT) { if (!a.pd) continue; const far = a.wrap.position.distanceToSquared(cam.position) > 2500 && a !== M.human; if (!far || (lodF + (a.i || 0)) % 2 === 0) flushPose(a); }   // lejos de la cámara: animación a medio ritmo
    if (recQ && !M.replay) { recQ = false; recFrame(); }
    const w = cv.clientWidth, h = cv.clientHeight, dpr = Math.max(.5, Math.min(devicePixelRatio || 1, maxDpr) * dynS);
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { Rn.setPixelRatio(dpr); Rn.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }
    if (window.__camOv) { const o = window.__camOv(P); cam.position.copy(o.p); cam.lookAt(o.l); }
    if (!draw.baked && !STREET && !/bake=0/.test(location.search)) { draw.baked = 1; try { window.__bake = bakeStatic(); } catch (e) { console.warn("bake", e); } }
    wxFrame(Math.min(.05, dt)); lodSel(); blobSel(); renderFrame(); hudFrame();
    // calidad adaptable según el tiempo REAL de cada fotograma: baja por escalones y nunca vuelve a subir de golpe (sin tirones)
    const now = performance.now(), rf = now - (draw.lt || now); draw.lt = now; fpsN++; fpsT += rf / 1000;
    if (fpsT > 1.5) { const f = Math.round(fpsN / fpsT); $("#fps").textContent = f + " fps · " + Math.round(dynS * 100) + " %"; fpsN = 0; fpsT = 0;
      // resolución dinámica (como en los juegos de móvil): baja un poco si no llega a 60 y vuelve a subir cuando sobra
      if (!window.STEP && !M.intro && simT > 3) { if (f < 50) dynS = Math.max(.62, dynS - .08); else if (f >= 58) dynS = Math.min(1, dynS + .04); }
      if (!window.STEP && !M.intro && simT > 4) { if (f < 48 && dynS <= .63) lowQ++; else lowQ = Math.max(0, lowQ - .5);
        if (lowQ >= 2 && !draw.q1) { draw.q1 = 1; sun.shadow.mapSize.set(1024, 1024); if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; } lowQ = 0; }
        else if (lowQ >= 2 && !draw.q2) { draw.q2 = 1; maxDpr = Math.min(maxDpr, 1); lowQ = 0; }
        else if (lowQ >= 2 && !draw.q3) { draw.q3 = 1; if (CROWD) CROWD.im.count = Math.floor(CROWD.n * .55); for (const a of P.concat(OFF)) a.inner.traverse(o => { if (o.isMesh) o.castShadow = a.gk || a === M.human; }); for (const a of P.concat(OFF)) a.inner.userData.cs = !!(a.gk || a === M.human); lowQ = 0; }
        else if (lowQ >= 2 && !draw.q4) { draw.q4 = 1; maxDpr = Math.min(maxDpr, .85); Rn.shadowMap.autoUpdate = false; lowQ = 0; }
        else if (lowQ >= 2 && !draw.q5) { draw.q5 = 1; maxDpr = .7; lowQ = 0; }
        else if (lowQ >= 2 && !draw.q6 && PF.on && PF.lite) { draw.q6 = 1; PF.on = false; lowQ = 0; } } }
  }
  // paso de simulación nunca mayor de 1/60 s: con pocos fps se hacen varios pasos (el balón no se queda atrás ni cambia el ritmo del juego)
  function frame(now) { const dt = Math.min(.1, (now - last) / 1000); last = now; if (!window.STEP) { const n = Math.min(3, Math.max(1, Math.ceil(dt * 30 - 1e-6))), h = dt / n; const gs = M.replay || M.intro ? 1 : 1.1; for (let i = 0; i < n; i++) tick(h * gs); /* ritmo DLS: el partido va un 10 % más rápido */ draw(dt); } requestAnimationFrame(frame); }
  window.__run = (n = 1, h = 1 / 30, noDraw) => { for (let i = 0; i < n; i++) tick(h); if (!noDraw) draw(h); return { clock: M.clock, half: M.half, phase: M.phase, score: [TEAMS[0].score, TEAMS[1].score], owner: M.owner && (M.owner.t + ":" + M.owner.role), set: M.set && M.set.type }; };
  window.__skill = (k, d) => skillMove(M.human, k, { dir: d, m: 1 }); window.__test = { foul, OFF, P, M, ball, K, TEAMS, gkS, startSet, TIMERS, requestKick, GKP, passTo, startOne, pose, place, META, traj, headerPt, get simT() { return simT; } };
  M.lockP = EMB && EMB.lock ? P.find(q => q.u === EMB.lock && q.t === M.humanTeam) || null : null; if (EMB && EMB.lock && !M.lockP) M.lockOut = true;
  if (M.lockP) M.human = M.lockP; else if (M.humanTeam >= 0 && !M.lockOut) setHuman(team(M.humanTeam).find(q => q.cat === "fwd") || team(M.humanTeam)[10]); updHud(); startSet("kick", 0);
  /* ---------- ambiente de noche y clima (luces de estadio, lluvia y nieve) ---------- */
  const WXP = { pts: null };
  (function atmos() {
    const hemi = S.children.find(o => o.isHemisphereLight), sky = S.children.find(o => o.isMesh && o.geometry && o.geometry.parameters && o.geometry.parameters.radius === 500);
    if (NIGHT) {
      if (sky) sky.material = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, vertexShader: sky.material.vertexShader,
        fragmentShader: "varying vec3 vP; void main(){ float h = normalize(vP).y; vec3 c = mix(vec3(.05,.07,.13), vec3(.008,.012,.03), smoothstep(0., .5, h)); gl_FragColor = vec4(c, 1.); }" });
      S.fog.color.setHex(0x060a14); S.fog.near = 160; S.fog.far = 420; if (hemi) { hemi.intensity = .45; hemi.color.setHex(0x9fb4ff); hemi.groundColor.setHex(0x1c2a18); }
      sun.intensity = 1.7; sun.color.setHex(0xeef3ff); S.environmentIntensity = .4; if (hemi) hemi.intensity = .85;
      const fill = new THREE.DirectionalLight(0xdfe8ff, 1.5); fill.position.set(0, 60, 80); S.add(fill);   // focos del lado de la cámara: iluminan a los jugadores de frente if (PF.comp) PF.comp.uniforms.ex.value = 1.12;
      if (CROWD) CROWD.im.material.color.setScalar(.55);
      // estadio nuevo de noche: estructura más oscura y un anillo de focos bajo el techo
      if (window.EST2) { const seen = new Set(); window.EST2.traverse(o => { if (o.isMesh && !seen.has(o.material)) { seen.add(o.material); o.material.emissive.multiplyScalar(.42); o.material.color.multiplyScalar(o.material.map ? .8 : .55); } });
        const lc = document.createElement("canvas"); lc.width = lc.height = 64; const lg = lc.getContext("2d"), lgr = lg.createRadialGradient(32, 32, 0, 32, 32, 32); lgr.addColorStop(0, "rgba(255,255,255,1)"); lgr.addColorStop(.3, "rgba(225,235,255,.7)"); lgr.addColorStop(1, "rgba(180,200,255,0)"); lg.fillStyle = lgr; lg.fillRect(0, 0, 64, 64);
        const lt = new THREE.CanvasTexture(lc), lm = new THREE.SpriteMaterial({ map: lt, color: 0xffffff, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }); lm.color.setScalar(2.2);
        const RX = L / 2 + 27, RY = W / 2 + 25, NL = 56; for (let i = 0; i < NL; i++) { const an = i / NL * Math.PI * 2, c = Math.cos(an), sn = Math.sin(an), k = 1 / Math.pow(Math.pow(Math.abs(c), 4) + Math.pow(Math.abs(sn), 4), .25);   // rectángulo redondeado
          const sp = new THREE.Sprite(lm); sp.position.copy(P3(L / 2 + c * k * RX, W / 2 + sn * k * RY, 33)); sp.scale.setScalar(5.5); S.add(sp); } }
      // focos encendidos: brillo en lo alto de cada torre (el bloom hace el halo)
      const gc = document.createElement("canvas"); gc.width = gc.height = 128; const g = gc.getContext("2d"), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(.25, "rgba(220,235,255,.8)"); gr.addColorStop(1, "rgba(160,190,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
      const gt = new THREE.CanvasTexture(gc); for (const [x, y] of (window.EST2 ? [] : [[-22, -26], [L + 22, -26], [-22, W + 24], [L + 22, W + 24]])) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: gt, color: 0xffffff, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); sp.material.color.setScalar(4); sp.position.copy(P3(x, y, 40)); sp.scale.setScalar(16); S.add(sp); }
    }
    if (WX) { const N = WX === "lluvia" ? 3500 : 3000, pos = new Float32Array(N * (WX === "lluvia" ? 6 : 3)), seed = new Float32Array(N * 3);
      for (let i = 0; i < N; i++) { seed[i * 3] = Math.random() * 70 - 35; seed[i * 3 + 1] = Math.random() * 30; seed[i * 3 + 2] = Math.random() * 70 - 35; }
      const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      WXP.pts = WX === "lluvia" ? new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: NIGHT ? 0x8fa6c8 : 0xc8d8ec, transparent: true, opacity: .2, depthWrite: false }))
                                : new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size: .16, transparent: true, opacity: .9, depthWrite: false }));
      WXP.pts.frustumCulled = false; WXP.seed = seed; WXP.N = N; WXP.t = 0; S.add(WXP.pts);
      if (WX === "lluvia") { ground.material.roughness = .5; ground.material.color.multiplyScalar(.85); if (!NIGHT) { sun.intensity *= .55; S.environmentIntensity *= .8; S.fog.color.setHex(0x8f9aa6); S.fog.near = 90; S.fog.far = 330; if (PF.comp) PF.comp.uniforms.ex.value = .95; } }
      else { ground.material.color.lerp(new THREE.Color(1, 1, 1), .35); if (!NIGHT) { sun.intensity *= .7; S.fog.color.setHex(0xc9d3dd); S.fog.near = 80; S.fog.far = 300; } } }
  })();
  function wxFrame(dt) { if (!WXP.pts) return; WXP.t += dt; const a = WXP.pts.geometry.attributes.position.array, s = WXP.seed, rain = WX === "lluvia", cx = (camL.x + cam.position.x) / 2, cz = (camL.z + cam.position.z) / 2, T = WXP.t;
    for (let i = 0; i < WXP.N; i++) { const fall = rain ? 19 : 1.3, y = 30 - ((s[i * 3 + 1] + T * fall) % 30), x = cx + ((s[i * 3] + (rain ? T * 1.5 : Math.sin(T * .7 + i) * .6) + 35) % 70 + 70) % 70 - 35, z = cz + ((s[i * 3 + 2] + 35) % 70 + 70) % 70 - 35;
      if (rain) { const k = i * 6; a[k] = x; a[k + 1] = y; a[k + 2] = z; a[k + 3] = x + .1; a[k + 4] = y + .8; a[k + 5] = z; } else { const k = i * 3; a[k] = x; a[k + 1] = y; a[k + 2] = z; } }
    WXP.pts.geometry.attributes.position.needsUpdate = true; }
  // precalienta las animaciones que usa el partido en todos los jugadores (adaptación + enlaces de huesos), así no hay tirones al usarlas por primera vez
  setLoad("preparando animaciones"); { const WARM = WARM_L;
    for (const a of P.concat(OFF)) { for (const n of WARM) { if (!META[n]) continue; const ac = a.act(n); if (!ac) continue; ac.play(); ac.paused = true; ac.setEffectiveWeight(0); } a.mixer.update(0); } }
  // precompila sombreadores y sube texturas antes de quitar la pantalla de carga (así no aparecen a trozos)
  setLoad("preparando el campo"); camera(1); try { if (Rn.compileAsync) await Rn.compileAsync(S, cam); else Rn.compile(S, cam); } catch (e) {}
  setLoad("compilado"); for (const p of P) { pose(p, 0, p.gk ? GKT : FWD); place(p); }
  { const hid = [], fc = []; S.traverse(o => { if (!o.visible) { hid.push(o); o.visible = true; } if (o.isMesh && o.frustumCulled) { fc.push(o); o.frustumCulled = false; } });
    try { if (Rn.compileAsync) await Rn.compileAsync(S, cam); renderFrame(); } catch (e) {} for (const o of hid) o.visible = false; for (const o of fc) o.frustumCulled = true; }
  // si el filtro de imagen deja la pantalla en negro en esta tarjeta gráfica, se quita
  if (PF.on) { try { renderFrame(); const gl = Rn.getContext(), px = new Uint8Array(4); gl.readPixels(cv.width >> 1, cv.height >> 2, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); if (px[0] + px[1] + px[2] < 6) { PF.on = false; console.warn("post desactivado: imagen negra"); } } catch (e) { PF.on = false; } }
  renderFrame(); setLoad("primer render"); window.__LTE = Math.round(performance.now()); await new Promise(r => requestAnimationFrame(r)); Rn.render(S, cam);
  // libera los textos base64 ya usados (en la versión sin internet son ~60 MB que si no se quedan en memoria)
  for (const k in AC_) delete AC_[k]; try { if (window.MA) { for (const k in window.MA) window.MA[k] = null; window.MA = null; } } catch (e) {}
  $("#load").remove();
  if (NET) netSend({ t: "listo" });
  if (DR) await drSetup();
  requestAnimationFrame(frame);
})().catch(e => { const d = document.querySelector("#load"); if (d) d.innerHTML = "Error: " + e.message; console.error(e); });
