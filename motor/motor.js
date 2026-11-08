/* MDG27 · MOTOR NUEVO · fase 1: un jugador, balón con física real y portero
   - las animaciones (Mixamo) mandan: velocidad emparejada con el ciclo de pasos, sin patinar
   - el balón va suelto: lo empujan los toques del pie que marca la animación
   - golpeos sincronizados: el pie llega al balón justo en el fotograma del contacto */
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
  const QUAL = (() => { let q = null; try { q = localStorage.getItem("mdg27q"); } catch (e) {} if (q) return q; const touch = matchMedia("(pointer: coarse)").matches, mem = navigator.deviceMemory || 8; return touch || mem <= 4 ? "baja" : "media"; })();
  let REAL = (() => { try { const v = localStorage.getItem("mdg27real"); return v == null ? QUAL === "alta" : v === "1"; } catch (e) { return false; } })();
  window.QUAL = QUAL; const TEXMAX = QUAL === "alta" ? 2048 : QUAL === "media" ? 1024 : 768;   // descargas en paralelo desde el principio
  const T0_ = performance.now(); window.__LT0 = Math.round(T0_); let TL_ = T0_; window.__LT = []; const setLoad = t => { const n = performance.now(); window.__LT.push([t, Math.round(n - TL_)]); TL_ = n; const e = $("#load b"); if (e) e.textContent = t; };

  /* ---------- render ---------- */
  const cv = $("#cv"), Rn = new THREE.WebGLRenderer({ canvas: cv, antialias: true, powerPreference: "high-performance" });
  window.__RN = Rn; Rn.domElement.addEventListener("webglcontextlost", e => { e.preventDefault(); try { localStorage.setItem("mdg27q", "baja"); } catch (er) {} const d = document.createElement("div"); Object.assign(d.style, { position: "fixed", inset: "0", display: "grid", placeItems: "center", background: "#050a14", color: "#fff", zIndex: 99, textAlign: "center", padding: "16px", font: "600 18px system-ui" }); d.innerHTML = "La tarjeta gráfica se ha quedado sin memoria.<br>He puesto la calidad en Baja.<br><br><button style='font:inherit;padding:10px 22px;border:0;border-radius:8px;background:#ffd23a;color:#111;cursor:pointer'>Volver a cargar</button>"; d.querySelector("button").onclick = () => location.reload(); document.body.appendChild(d); }); Rn.debug.checkShaderErrors = !!window.SHDBG; if (QUAL !== "alta") Rn.shadowMap.type = THREE.PCFShadowMap; Rn.outputColorSpace = THREE.SRGBColorSpace; Rn.toneMapping = THREE.ACESFilmicToneMapping; Rn.toneMappingExposure = 1.05;
  Rn.shadowMap.enabled = true; Rn.shadowMap.type = THREE.PCFSoftShadowMap;
  const S = new THREE.Scene(); S.fog = new THREE.Fog(0xa9c4dc, 180, 420);
  { const sky = new THREE.Mesh(new THREE.SphereGeometry(500, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, uniforms: {},
      vertexShader: "varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }",
      fragmentShader: "varying vec3 vP; void main(){ float h = normalize(vP).y; vec3 c = mix(vec3(.72,.82,.92), vec3(.25,.5,.85), smoothstep(0., .55, h)); gl_FragColor = vec4(c, 1.); }" })); S.add(sky); }
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
  const gMat = new THREE.MeshStandardMaterial({ map: pitch, roughness: .9, color: PLAYA ? new THREE.Color(1.25, 1.05, .72) : CANCHA ? new THREE.Color(.8, .82, .86) : STREET ? new THREE.Color(.42, .44, .48) : new THREE.Color(.76, .82, .72) });
  // detalle fino del césped (ruido por posición): da textura de hierba de cerca sin imágenes nuevas
  if (!STREET) gMat.onBeforeCompile = sh => { sh.vertexShader = "varying vec3 vWP;\n" + sh.vertexShader.replace("#include <worldpos_vertex>", "#include <worldpos_vertex>\n vWP = (modelMatrix * vec4(transformed, 1.)).xyz;");
    sh.fragmentShader = "varying vec3 vWP;\nfloat h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }\nfloat vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }\n" + sh.fragmentShader.replace("#include <map_fragment>", "#include <map_fragment>\n { float n = vn(vWP.xz * 3.1) * .55 + vn(vWP.xz * 11.) * .3 + vn(vWP.xz * .6) * .15; diffuseColor.rgb *= .9 + n * .2; }"); };
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
  const STANDS = [];
  if (!STREET) { const g = await new GLTFLoader().parseAsync(b64buf(await asset("m_est_grada")), ""), src = g.scene, bb = new THREE.Box3().setFromObject(src), sz = bb.getSize(new THREE.Vector3());
    src.traverse(m => { if (m.isMesh) m.receiveShadow = true; });
    const roofM = new THREE.MeshStandardMaterial({ color: 0xa4abb5, roughness: .8, metalness: 0, emissive: 0x4a4f57 }), wallM = new THREE.MeshStandardMaterial({ color: 0x8b8f96, roughness: .95, emissive: 0x2c3036 });
    const side = (cx, cy, len, rot, e0 = 0, e1 = 0, nr = false) => { const grp = new THREE.Group(); grp.position.copy(P3(cx, cy, 0)); grp.rotation.y = rot; S.add(grp);
      const n = Math.max(1, Math.round(len / 13)), tw = len / n, k = tw / sz.x, d = sz.z * k, h = sz.y * k;
      for (let ring = 0; ring < 2; ring++) for (let i = 0; i < n; i++) { const o = src.clone(); o.scale.setScalar(k); o.position.set(-len / 2 + tw * (i + .5) - (bb.min.x + sz.x / 2) * k, -bb.min.y * k + ring * (h - .6), -d / 2 - (bb.min.z + sz.z / 2) * k - ring * (d - .4)); grp.add(o); STANDS.push(o); }
      e0 = e0 && 2 * d + 10; e1 = e1 && 2 * d + 10; const ox = (e1 - e0) / 2;
      const back = new THREE.Mesh(new THREE.BoxGeometry(len + e0 + e1, 2 * h + 6, .6), wallM); back.position.set(ox, h + 3, -2 * d - .2); 
      const roof = new THREE.Mesh(new THREE.BoxGeometry(len + 2 + e0 + e1, .5, 2 * d + 4), roofM); roof.position.set(ox, 2 * h + 6, -d); roof.rotation.x = -.06; if (!nr) { grp.add(roof); grp.add(back); } };
    side(L / 2, -7.6, L + 14, 0, 1, 1); side(-7.6, W / 2, W - 2, Math.PI / 2, 0, 1); side(L + 7.6, W / 2, W - 2, -Math.PI / 2, 1, 0);
    // esquinas: un tramo de grada en diagonal para cerrar el hueco entre la tribuna y los fondos
    side(-7.4, -7.4, 18, Math.PI / 4, 0, 0, true); side(L + 7.4, -7.4, 18, -Math.PI / 4, 0, 0, true); }
  // esquinas cerradas (módulo de esquina de Meshy) para que no se vea el hueco entre gradas
  setLoad("estadio (focos y banquillos)");
  if (!STREET) for (const [x, y] of [[-22, -26], [L + 22, -26], [-22, W + 24], [L + 22, W + 24]]) await prop("est_foco", 42, "y", x, y, 0, Math.atan2(W / 2 - y, L / 2 - x));
  if (!STREET) for (const bx of [L / 2 - 11, L / 2 + 11]) await prop("est_banquillo", 7, "x", bx, -3.4, 0, 0);
  if (!STREET) { // videomarcadores (imagen de Guille) con el resultado en directo
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
  // cada clip de locomoción: velocidad natural, nº de ciclos y fase del apoyo izquierdo
  const LOCO = [ { n: "StandardIdle", v: 0 }, { n: "StandardWalk", v: 1.49 }, { n: "JogForward", v: 2.46 }, { n: "StandardRun", v: 4.12 }, { n: "Running", v: 5.61 }, { n: "SprintForward", v: 6.9 } ];
  const LOCOB = [ { n: "StandardIdle", v: 0 }, { n: "StandardWalk", v: 1.49 }, { n: "Dribble", v: 2.66, cyc: 2 }, { n: "StandardRun", v: 4.12 }, { n: "Running", v: 5.61 }, { n: "SprintForward", v: 6.9 } ];
  for (const l of [...LOCO, ...LOCOB]) { const m = META[l.n]; l.dur = m.dur; l.cyc = l.cyc || 1; l.lph = m.lfw || 0; l.touch = (m.touch || []).filter(e => l.cyc === 1 || true); }

  setLoad("jugadores");
  async function makeActor(modelName, scale = 1) {
    const g = await GL().parseAsync(b64buf(await asset("m_" + modelName)), "");
    const wrap = new THREE.Group(), inner = THREE.SkeletonUtils ? THREE.SkeletonUtils.clone(g.scene) : SkeletonUtils.clone(g.scene);
    const bb = new THREE.Box3().setFromObject(g.scene), k = 1.82 * scale / (bb.max.y - bb.min.y); inner.scale.setScalar(k); inner.position.y = -bb.min.y * k;
    inner.traverse(o => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; } }); wrap.add(inner); S.add(wrap);
    const mixer = new THREE.AnimationMixer(inner), acts = {}, cl = clipsFor(g);
    for (const [n, c] of Object.entries(cl)) { const a = mixer.clipAction(c); a.enabled = false; a.setEffectiveWeight(0); a.play(); acts[n] = a; }
    const toes = { R: inner.getObjectByName("RightToeBase"), L: inner.getObjectByName("LeftToeBase") }, hands = [inner.getObjectByName("RightHand"), inner.getObjectByName("LeftHand")];
    return { wrap, inner, mixer, acts, toes, hands, k, x: 0, y: 0, h: 0, v: 0, Phi: 0, one: null, oneW: 0, lean: 0, prevPhi: 0 };
  }
  // pone pesos y tiempos a mano: locomoción sincronizada por fase + una animación suelta encima con fundido
  function pose(a, dt, table) {
    const used = new Set();
    const ow = a.one ? Math.min(1, a.oneW) : Math.max(0, a.oneW);
    // locomoción: dos clips vecinos según la velocidad
    const v = a.v; let i = 0; while (i < table.length - 2 && v > table[i + 1].v) i++;
    const A = table[i], B = table[i + 1], w = clamp((v - A.v) / (B.v - A.v), 0, 1);
    const vN = lerp(A.v, B.v, w), cA = A.dur / A.cyc, cB = B.dur / B.cyc;
    const cyc = A.v === 0 ? cB : lerp(cA, cB, w);
    const rate = A.v === 0 ? (w > 0 ? Math.max(.55, v / B.v) : 0) : v / Math.max(.3, vN);
    a.prevPhi = a.Phi; a.Phi += dt / cyc * rate * (B.v > 6.5 && v > 6.9 ? 1 : 1);
    const lw = 1 - ow;
    for (const [c, wt] of [[A, 1 - w], [B, w]]) { if (wt <= .001) continue; const act = a.acts[c.n]; used.add(c.n);
      act.enabled = true; act.setEffectiveWeight(wt * lw); act.paused = true;
      act.time = c.v === 0 ? (a.idleT = (a.idleT || 0) + dt) % c.dur : (((c.lph + a.Phi / c.cyc) % 1 + 1) % 1) * c.dur; }
    a.locoA = A; a.locoB = B; a.locoW = w;
    const o_ = a.one || a.lastOne; if (o_ && (a.one || a.oneW > 0)) { const o = o_; const act = a.acts[o.n]; used.add(o.n); act.enabled = true; act.paused = true; act.setEffectiveWeight(ow); act.time = Math.min(o.t, act.getClip().duration - 1e-3); }
    for (const [n, act] of Object.entries(a.acts)) if (!used.has(n) && act.enabled) { act.enabled = false; act.setEffectiveWeight(0); }
    a.mixer.update(0);
  }
  function startOne(a, n, o = {}) { const m = META[n]; if (!m || !a.acts[n]) return null; a.one = Object.assign({ n, t: o.t0 || 0, ts: o.ts || 1, m, x0: a.x, y0: a.y, h0: a.h, rmPrev: rmAt(m, o.t0 || 0), yawPrev: yawAt(m, o.t0 || 0) }, o); a.oneW = Math.max(a.oneW, 0); return a.one; }
  function rmAt(m, t) { const r = m.rm; if (!r) return [0, 0]; const f = clamp(t * 15, 0, r.length - 1), i = Math.floor(f), j = Math.min(r.length - 1, i + 1), u = f - i; return [lerp(r[i][0], r[j][0], u), lerp(r[i][1], r[j][1], u)]; }
  function yawAt(m, t) { const r = m.yawC; if (!r) return 0; const f = clamp(t * 15, 0, r.length - 1), i = Math.floor(f), j = Math.min(r.length - 1, i + 1); return lerp(r[i], r[j], f - i); }
  // avanza la animación suelta aplicando su desplazamiento (root motion) y su giro al jugador
  function stepOne(a, dt) {
    const o = a.one; if (!o) { a.oneW = Math.max(0, a.oneW - dt / .18); return; }
    a.oneW = Math.min(1, a.oneW + dt / (o.fadeIn || .1));
    o.t += dt * o.ts; const end = o.end || o.m.dur;
    const r = rmAt(o.m, o.t), dx = r[0] - o.rmPrev[0], dz = r[1] - o.rmPrev[1]; o.rmPrev = r;
    // root del clip: z adelante, x a la izquierda del jugador → coordenadas de campo
    const hx = Math.cos(o.h0), hy = Math.sin(o.h0);
    let mx = hx * dz + hy * dx, my = hy * dz - hx * dx; if (o.rootScale != null) { mx *= o.rootScale; my *= o.rootScale; }
    if (o.warp && o.t - (o.t0 || 0) <= o.warp.t) { mx += o.warp.x * dt * o.ts / o.warp.t; my += o.warp.y * dt * o.ts / o.warp.t; }
    a.x += mx; a.y += my;
    const yw = yawAt(o.m, o.t); a.h -= (yw - o.yawPrev); o.yawPrev = yw;
    if (o.turnTo != null && o.t < (o.turnT || .3)) a.h += angD(a.h, o.turnTo) * Math.min(1, dt * o.ts / Math.max(.05, (o.turnT || .3) - o.t + dt));
    a.v = Math.hypot(mx, my) / Math.max(dt, 1e-4);
    if (o.onT && !o.fired && o.t >= o.onT) { o.fired = true; o.on(); }
    if (o.t >= end - (o.fadeOut || .15) * o.ts && (!o.onT || o.fired)) { a.lastOne = o; a.one = null; if (o.after) o.after(); }
  }
  function place(a, dt) {
    a.wrap.position.copy(P3(a.x, a.y, 0));
    a.wrap.rotation.set(0, -a.h + Math.PI / 2, 0, "YXZ"); a.wrap.rotateZ(0); a.inner.rotation.z = a.lean;
  }

  const pl = await makeActor("pj05"), gk = await makeActor("gk01");
  pl.x = 70; pl.y = W / 2 + 8; pl.h = 0;
  gk.x = L - 1.2; gk.y = W / 2; gk.h = Math.PI;

  /* ---------- balón ---------- */
  const ball = { x: 72, y: W / 2 + 8, z: 0, vx: 0, vy: 0, vz: 0, wx: 0, wy: 0, wz: 0, inNet: false };
  function ballStep(b, dt) {
    const sp = Math.hypot(b.vx, b.vy, b.vz);
    if (b.z > .001 || b.vz > 0) {
      const kd = .0125 * sp;                                   // aire: arrastre cuadrático + efecto Magnus
      b.vx -= kd * b.vx * dt; b.vy -= kd * b.vy * dt; b.vz -= (kd * b.vz + G) * dt;
      const km = .0042; b.vx += km * (b.wy * b.vz - b.wz * b.vy) * dt; b.vy += km * (b.wz * b.vx - b.wx * b.vz) * dt; b.vz += km * (b.wx * b.vy - b.wy * b.vx) * dt;
      b.z += b.vz * dt;
      if (b.z <= 0) { b.z = 0; if (b.vz < -1.2) { b.vz = -b.vz * .55; b.vx *= .82; b.vy *= .82; b.wx *= .5; b.wy *= .5; b.wz *= .6; } else b.vz = 0; }
    } else {   // rodando sobre césped
      const h = Math.hypot(b.vx, b.vy); if (h > 0) { const ns = Math.max(0, h - (.8 + .3 * h) * dt); b.vx *= ns / h; b.vy *= ns / h; }
      b.wz *= Math.pow(.2, dt); b.wx = b.wy = 0;
    }
    b.x += b.vx * dt; b.y += b.vy * dt;
    // porterías: postes, larguero y red
    for (const side of [0, 1]) { const gx = side ? L : 0, dir = side ? 1 : -1, inside = (b.x - gx) * dir;
      for (const py of [W / 2 - GW / 2, W / 2 + GW / 2]) { const dx = b.x - gx, dy = b.y - py, d = Math.hypot(dx, dy); if (d < BR + .06 && b.z < GH) { const nx = dx / d, ny = dy / d, vn = b.vx * nx + b.vy * ny; if (vn < 0) { b.vx -= 1.7 * vn * nx; b.vy -= 1.7 * vn * ny; b.x = gx + nx * (BR + .061); b.y = py + ny * (BR + .061); hit("poste"); } } }
      if (Math.abs(inside) < BR + .06 && Math.abs(b.z - GH) < BR + .06 && Math.abs(b.y - W / 2) < GW / 2) { const dz = b.z - GH, dx = b.x - gx, d = Math.hypot(dx, dz) || 1; const nx = dx / d, nz = dz / d, vn = b.vx * nx + b.vz * nz; if (vn < 0) { b.vx -= 1.7 * vn * nx; b.vz -= 1.7 * vn * nz; hit("larguero"); } }
      if (inside > 0 && inside < GD + .5 && Math.abs(b.y - W / 2) < GW / 2 && b.z < GH) { if (!b.inNet) { b.inNet = true; goalScored(side); } if (inside > GD - .2) { b.vx *= -.15; b.x = gx + dir * (GD - .2); b.vy *= .4; b.vz *= .3; const n = nets.find(q => q.side === side && q.part === "back"); n.hit = 1; n.hx = b.x; n.hy = b.y; n.hz = b.z; } }
    }
    // fuera del campo: rebota en las vallas para seguir jugando
    if (b.x < -4 || b.x > L + 4) { b.vx *= -.4; b.x = clamp(b.x, -4, L + 4); } if (b.y < -4.5 || b.y > W + 4.5) { b.vy *= -.4; b.y = clamp(b.y, -4.5, W + 4.5); }
  }
  function predictBall(t) { const b = Object.assign({}, ball), h = 1 / 60; const inN = ball.inNet; for (let k = 0; k < t; k += h) { const sp = Math.hypot(b.vx, b.vy, b.vz); if (b.z > .001 || b.vz > 0) { const kd = .0125 * sp; b.vx -= kd * b.vx * h; b.vy -= kd * b.vy * h; b.vz -= (kd * b.vz + G) * h; b.z += b.vz * h; if (b.z <= 0) { b.z = 0; b.vz = b.vz < -1.2 ? -b.vz * .55 : 0; } } else { const hh = Math.hypot(b.vx, b.vy); if (hh > 0) { const ns = Math.max(0, hh - (.8 + .3 * hh) * h); b.vx *= ns / hh; b.vy *= ns / hh; } } b.x += b.vx * h; b.y += b.vy * h; } return b; }

  /* ---------- sonido mínimo ---------- */
  let AC = null; const sfx = (f, d, g, type = "sine") => { try { AC = AC || new AudioContext(); const t = AC.currentTime, o = AC.createOscillator(), gn = AC.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(Math.max(30, f * .35), t + d); gn.gain.setValueAtTime(g, t); gn.gain.exponentialRampToValueAtTime(.001, t + d); o.connect(gn); gn.connect(AC.destination); o.start(t); o.stop(t + d + .02); } catch (e) {} };
  const touchSfx = s => sfx(120 + s * 8, .09, clamp(.05 + s * .012, .05, .45));
  let msgT = 0; const msg = (t, d = 1.6) => { const e = $("#msg"); e.textContent = t; e.style.opacity = 1; msgT = d; };
  let hitT = 0; function hit(w) { if ((simT * 1000) - hitT < 300) return; hitT = (simT * 1000); sfx(900, .35, .3, "triangle"); msg(w === "poste" ? "¡AL PALO!" : "¡LARGUERO!"); }
  let goals = 0, shots = 0, resetT = 0;
  function goalScored(side) { if (side !== 1) return; goals++; msg("¡GOOOL!", 2.4); sfx(220, .8, .4, "sawtooth"); resetT = 4.2; updHud();
    celeT = 3.5; msg("¡GOOOL!  (Y = celebrar)", 2.6); }
  let celeT = 0, celeN = 0;
  function celebrate() { if (celeT <= 0 || pl.one) return; celeT = 0; const c = ["Cheering", "Victory", "Clapping", "HappyIdle"].filter(n => META[n])[celeN++ % 4]; startOne(pl, c, { ts: 1, end: Math.min(META[c].dur, 3), fadeIn: .25 }); resetT = Math.max(resetT, 3.2); }
  let simT = 0, lowQ = 0, maxDpr = 1.25;
  const updHud = () => { $("#score").textContent = `Goles ${goals} · Tiros ${shots}`; };

  /* ---------- entrada: teclado y mando ---------- */
  const K = {}; addEventListener("keydown", e => { K[e.code] = true; if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) e.preventDefault(); if (e.code === "KeyR") resetBall(); });
  addEventListener("keyup", e => { K[e.code] = false; });
  const btnPrev = {};
  function input() {
    let mx = (K.KeyD || K.ArrowRight ? 1 : 0) - (K.KeyA || K.ArrowLeft ? 1 : 0), my = (K.KeyS || K.ArrowDown ? 1 : 0) - (K.KeyW || K.ArrowUp ? 1 : 0);
    let fin = !!K.KeyF, cele = !!K.KeyY, walk = !!(K.ControlLeft || K.KeyC), spr = !!(K.ShiftLeft || K.ShiftRight), shoot = !!K.Space || !!K.KeyK, pass = !!K.KeyJ || !!K.KeyE, lob = !!K.KeyL || !!K.KeyQ;
    let gps = []; try { gps = navigator.getGamepads ? [...navigator.getGamepads()] : []; } catch (e) {} const gp = gps.find(p => p && p.connected);
    if (gp) { const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0; if (Math.hypot(ax, ay) > .18) { mx = ax; my = ay; }
      const b = i => gp.buttons[i] && (gp.buttons[i].pressed || gp.buttons[i].value > .4);
      spr = spr || b(7); fin = fin || b(5); cele = cele || b(3); shoot = shoot || b(1); pass = pass || b(0); lob = lob || b(2);
      if (b(9) && !btnPrev.st) resetBall(); btnPrev.st = b(9); }
    let m = Math.min(1, Math.hypot(mx, my)); if (walk && m > .3) m = .4;
    // pantalla: derecha = +x del campo, abajo = +y (cámara de televisión desde la banda)
    return { m, dir: m > .05 ? Math.atan2(my, mx) : null, spr, shoot, pass, lob, cele, fin, my };
  }

  /* ---------- jugador: movimiento con inercia ---------- */
  const ST = { pac: 84, acc: 86, agi: 85, bal: 80, dri: 86, sho: 85, pas: 82 };   // atributos de prueba
  const vMax = () => 6.0 + (ST.pac - 70) * .03, vSpr = () => 7.4 + (ST.pac - 70) * .07;
  const near = { d: 99 };
  function ownBall() { const dx = ball.x - pl.x, dy = ball.y - pl.y, d = Math.hypot(dx, dy); near.d = d; return d < 1.6 && ball.z < .5 && !pl.kickLock; }

  function movePlayer(dt, I) {
    const has = ownBall();
    if (pl.one) return;
    let want = 0, wantH = pl.h;
    if (I.dir != null) { wantH = I.dir; want = I.m < .45 ? I.m / .45 * 1.6 : lerp(2.4, I.spr ? vSpr() : vMax(), (I.m - .45) / .55); if (has && I.spr) want *= .94; if (has && !I.spr) want = Math.min(want, 5.2); }
    const dh = angD(pl.h, wantH), adh = Math.abs(dh);
    // giro de 180º a toda velocidad: animación de giro (con balón, lo arrastra con la suela)
    pl.turnCd = Math.max(0, (pl.turnCd || 0) - dt);
    if (false) {
      const o = startOne(pl, "RunningTurn180", { ts: 1.15, end: .6, turnTo: wantH, turnT: .55 }); if (o) { o.fadeIn = .08; o.withBall = has; if (has) touchSfx(2); o.after = () => { pl.v = 2.4; if (o.withBall) { ball.vx = Math.cos(pl.h) * 3.2; ball.vy = Math.sin(pl.h) * 3.2; touchSfx(3); } }; return; } }
    // frenada a toda velocidad
    pl.idleT = I.dir == null ? (pl.idleT || 0) + dt : 0;
    if (false) { const o = startOne(pl, "RunningToStop", { ts: 1.25, end: 1.2 }); if (o) { o.after = () => { pl.v = 0; }; return; } }
    // velocidad de giro: rápida parado, lenta a tope (más ágil = gira mejor)
    const agi = .8 + (ST.agi - 70) * .008, wMax = lerp(9.5, 2.6, clamp(pl.v / 7.5, 0, 1)) * agi;
    pl.h += clamp(dh, -wMax * dt, wMax * dt);
    const turnLoss = clamp(1 - (adh - .5) * .35, .45, 1);   // al girar fuerte se pierde velocidad
    const tgt = want * (adh > .5 ? turnLoss : 1);
    const accel = (tgt > pl.v ? (pl.v < 3 ? 6.5 : 3.8) * (.85 + (ST.acc - 70) * .01) : 9);
    pl.v += clamp(tgt - pl.v, -accel * dt, accel * dt);
    pl.x += Math.cos(pl.h) * pl.v * dt; pl.y += Math.sin(pl.h) * pl.v * dt;
    const om = clamp(dh, -wMax * dt, wMax * dt) / Math.max(dt, 1e-3); pl.lean = lerp(pl.lean, clamp(-om * pl.v * .018, -.25, .25), Math.min(1, dt * 6));
    pl.x = clamp(pl.x, -3, L + 3); pl.y = clamp(pl.y, -3, W + 3);
  }
  // toques de conducción: cuando el pie de la animación pasa por delante y el balón está a su alcance
  // CONDUCCIÓN (como FIFA/PES): cada toque de la animación calcula dónde estará el pie en el toque siguiente
  // y lanza el balón rodando para que llegue justo ahí. Entre toques el balón rueda libre; si cambias de
  // dirección, el siguiente punto de contacto se recalcula y el balón se corrige un poco (sin imán).
  const tv = new THREE.Vector3(); const dr = { plan: null, lastT: -9, loose: 0, lastFoot: "R" };
  const rollV0 = (D, T) => Math.max(0, (D + 2.667 * T) * .3 / (1 - Math.exp(-.3 * T)) - 2.667);
  function footLocal(f) { pl.toes[f].getWorldPosition(tv); const fx = tv.x + L / 2 - pl.x, fy = tv.z + W / 2 - pl.y, hx = Math.cos(pl.h), hy = Math.sin(pl.h); return { a: fx * hx + fy * hy, l: -fx * hy + fy * hx, x: tv.x + L / 2, y: tv.z + W / 2 }; }
  function nextEvent(tab, ph, skip) { const ev = (tab.touch || []).map(e => e[0]).sort((a, b) => a - b); if (!ev.length) return null; let n = 0, best = null;
    for (let k = 0; k < 4 && best == null; k++) for (const e of ev) { const d = e - ph + k; if (d > .02) { if (n === skip) { best = d; break; } n++; } } return best; }
  function contactPoint(T, dirH, f) { // dónde estará la puntera del pie f dentro de T segundos
    const h2 = pl.h + clamp(angD(pl.h, dirH), -2.2 * T, 2.2 * T), v = pl.v, px = pl.x + Math.cos(pl.h) * v * T * .5 + Math.cos(h2) * v * T * .5, py = pl.y + Math.sin(pl.h) * v * T * .5 + Math.sin(h2) * v * T * .5;
    const ah = (dr.fwd != null ? dr.fwd : .35), lt = (f === "R" ? .1 : -.1);
    return { x: px + Math.cos(h2) * ah + Math.sin(h2) * -lt, y: py + Math.sin(h2) * ah - Math.cos(h2) * lt, h: h2 }; }
  function dribble(dt, I) {
    if (pl.one || pl.kickLock || !pl.locoA) { dr.plan = null; return; }
    const dx = ball.x - pl.x, dy = ball.y - pl.y, hx = Math.cos(pl.h), hy = Math.sin(pl.h), ahead = dx * hx + dy * hy, lat = -dx * hy + dy * hx, d = Math.hypot(dx, dy);
    if (dr.loose > 0) { dr.loose -= dt; dr.plan = null; return; }
    if (ball.z > .35 || d > 2.2) { dr.plan = null; return; }
    const ctl = .8 + (ST.dri - 70) * .012, spr = I.spr && pl.v > 5.3, wantH = I.dir == null ? pl.h : I.dir;
    // parado o casi: el balón se queda bajo la suela, delante de la bota
    if (pl.v < .9) { dr.plan = null; const tx = pl.x + hx * .42, ty = pl.y + hy * .42, a = Math.min(1, dt * 6);
      if (d < 1.4) { ball.vx += ((tx - ball.x) * 3 - ball.vx) * a; ball.vy += ((ty - ball.y) * 3 - ball.vy) * a; } return; }
    const tab = pl.locoW > .5 ? pl.locoB : pl.locoA, cyc = tab.cyc, ph1 = ((tab.lph + pl.Phi / cyc) % 1 + 1) % 1;
    const phRate = (pl.Phi - pl.prevPhi) / Math.max(dt, 1e-4);       // pasos-ciclo por segundo
    let foot = null;
    for (const f of ["R", "L"]) { const fl = footLocal(f), st = dr[f] || (dr[f] = { a: fl.a, up: false });
      if (st.up && fl.a < st.a - .004 && st.a > .05) { foot = f; dr.fwd = dr.fwd == null ? st.a : lerp(dr.fwd, st.a, .3); }
      st.up = fl.a > st.a + .002 ? true : fl.a < st.a - .002 ? false : st.up; st.a = fl.a; }
    if (foot && simT - dr.lastT > .12) {
      const fl = footLocal(foot), fd = Math.hypot(ball.x - fl.x, ball.y - fl.y);
      const near = fd < .5 || (dr.plan && Math.hypot(ball.x - dr.plan.x, ball.y - dr.plan.y) < .6) || (ahead > -.1 && ahead < .9 && Math.abs(lat) < .45);
      const sprSkip = spr && (dr.sk = !dr.sk);
      if (near && !sprSkip) {
        dr.lastT = simT; dr.lastFoot = foot; (dr.log = dr.log || []).push(+fd.toFixed(2));
        const T = clamp((spr ? 1 : .5) / Math.max(.4, phRate), .16, 1.1);
        const nf = foot === "R" ? "L" : "R", cp = contactPoint(T, wantH, spr ? foot : nf);
        // el balón debe ir un poco por delante de la puntera en el contacto
        const lead = .11 + (1 - ctl) * .15 + (spr ? .55 : 0), tx = cp.x + Math.cos(cp.h) * lead, ty = cp.y + Math.sin(cp.h) * lead;
        const D = Math.hypot(tx - ball.x, ty - ball.y), v0 = clamp(rollV0(D, T), 0, pl.v * 2.2 + 1.5), a = Math.atan2(ty - ball.y, tx - ball.x) + (Math.random() - .5) * (1.15 - ctl) * .1;
        ball.vx = Math.cos(a) * v0; ball.vy = Math.sin(a) * v0; ball.vz = 0;
        dr.plan = { x: tx, y: ty, t: simT + T, h: cp.h }; touchSfx(1 + pl.v * .35);
      }
    }
    if (I.dir != null && d < 1.5 && simT - dr.lastT > .16 && Math.abs(angD(dr.plan ? dr.plan.h : pl.h, wantH)) > .55) {
      const fR = footLocal("R"), fL = footLocal("L"), f = Math.hypot(ball.x - fR.x, ball.y - fR.y) < Math.hypot(ball.x - fL.x, ball.y - fL.y) ? "R" : "L";
      const T = clamp(.22 + pl.v * .015, .2, .4), cp = contactPoint(T, wantH, f === "R" ? "L" : "R"), tx = cp.x + Math.cos(cp.h) * .11, ty = cp.y + Math.sin(cp.h) * .11;
      const D = Math.hypot(tx - ball.x, ty - ball.y), v0 = clamp(rollV0(D, T), 0, pl.v * 2 + 2), a = Math.atan2(ty - ball.y, tx - ball.x);
      ball.vx = Math.cos(a) * v0; ball.vy = Math.sin(a) * v0; dr.lastT = simT; dr.lastFoot = f; dr.plan = { x: tx, y: ty, t: simT + T, h: cp.h }; touchSfx(1.5 + pl.v * .3); }
    // entre toques: si cambias de dirección, el punto de contacto se mueve y el balón se corrige suavemente
    if (dr.plan && dr.plan.t > simT + .06) {
      const T = dr.plan.t - simT, nf = dr.lastFoot === "R" ? "L" : "R", cp = contactPoint(T, wantH, nf);
      const tx = cp.x + Math.cos(cp.h) * .11, ty = cp.y + Math.sin(cp.h) * .11, D = Math.hypot(tx - ball.x, ty - ball.y), v0 = clamp(rollV0(D, T), 0, pl.v * 2.2 + 1.5), a = Math.atan2(ty - ball.y, tx - ball.x);
      const k = Math.min(1, dt * 5 * ctl); ball.vx += (Math.cos(a) * v0 - ball.vx) * k; ball.vy += (Math.sin(a) * v0 - ball.vy) * k;
    } else if (!dr.plan && d < 1.2 && ahead > -.2) {   // aún sin plan (recién recibido): un toque suave hacia delante
      const tx = pl.x + hx * (.6 + pl.v * .25), ty = pl.y + hy * (.6 + pl.v * .25), k = Math.min(1, dt * 4); ball.vx += ((tx - ball.x) * 2.5 + pl.v * hx - ball.vx) * k; ball.vy += ((ty - ball.y) * 2.5 + pl.v * hy - ball.vy) * k; }
    // giro muy brusco a tope de velocidad: el balón se puede escapar
    if (pl.v > 6.2 && I.dir != null && Math.abs(angD(pl.h, I.dir)) > 1.7 && Math.random() < dt * (3 - ctl * 1.6)) { dr.loose = .45; dr.plan = null; }
  }

  /* ---------- golpeos ---------- */
  const KC = { shot: { st: "KickSoccerball1", run: "StrikeFowardJog" }, pass: { st: "SoccerPass", run: "SoccerPass" }, lob: { st: "Chip", run: "Chip" } };
  let charge = null, req = null;
  function kickInput(I, dt) {
    const keys = { shot: I.shoot, pass: I.pass, lob: I.lob };
    if (!charge) { for (const k in keys) if (keys[k] && !btnPrev[k]) { charge = { k, p: 0 }; break; } }
    else { if (I.fin) charge.fin = true; charge.p = Math.min(1, charge.p + dt / (charge.k === "pass" ? .9 : 1.05)); if (!keys[charge.k]) { req = { k: charge.k, p: Math.max(.12, charge.p), dir: I.dir, ay: I.dir != null ? I.my : null, fin: I.fin || charge.fin, at: (simT * 1000) }; charge = null; } }
    for (const k in keys) btnPrev[k] = keys[k];
    $("#pw").style.display = charge ? "block" : "none"; if (charge) $("#pw i").style.width = (charge.p * 100) + "%";
    if (req && (simT * 1000) - req.at > 700) req = null;   // el balón está lejos: se anula
    if (req && !pl.one) tryKick();
  }
  function tryKick() {
    const r = req, goalX = L, side = r.ay != null && Math.abs(r.ay) > .25 ? Math.sign(r.ay) : (ball.y < W / 2 ? 1 : -1), aimY = W / 2 + side * (GW / 2 - (r.fin ? .4 : .5));
    let aimH = r.k === "shot" ? Math.atan2(aimY - ball.y, goalX - ball.x) : (r.dir != null ? r.dir : pl.h);
    const moving = pl.v > 2.6, kc = KC[r.k], base = moving ? kc.run : kc.st;
    // ¿con qué pie? el balón a la izquierda del cuerpo o un pase cruzado a la izquierda → izquierda
    const dx = ball.x - pl.x, dy = ball.y - pl.y, lat = -dx * Math.sin(pl.h) + dy * Math.cos(pl.h);
    const turn = angD(pl.h, aimH), left = lat < -.12 || (lat < .1 && turn < -.6);
    const name = left && META[base + "_M"] ? base + "_M" : base, m = META[name]; if (!m || !m.kick) { req = null; return; }
    const ts = moving ? clamp(pl.v / Math.max(1.5, m.speed || 2.3), .9, 1.6) : 1.15;
    const tc = m.kick.t / ts; const pb = predictBall(tc);
    // dónde tiene que estar el jugador en el contacto para que el pie llegue al balón
    const hC = pl.h + clamp(turn, -1.2, 1.2), cx = Math.cos(hC), cy = Math.sin(hC);
    const fx = m.kick.fz, fl = m.kick.fx;       // pie: fz delante, fx a la izquierda (incluye lo que avanza el clip)
    const footOff = { x: cx * fx + cy * fl * 1, y: cy * fx - cx * fl };
    const needX = pb.x - footOff.x, needY = pb.y - footOff.y;
    const ex = needX - pl.x, ey = needY - pl.y, e = Math.hypot(ex, ey);
    if (e > (moving ? 1.6 : 1.1) || pb.z > .8) return;                      // aún no llega: sigue corriendo hacia el balón
    req = null; shots += r.k === "shot" ? 1 : 0; updHud();
    pl.kickLock = true;
    const o = startOne(pl, name, { ts, h0: hC, warp: { x: ex, y: ey, t: m.kick.t }, turnTo: hC, turnT: m.kick.t * .8, fadeIn: .08, end: Math.min(m.dur, m.kick.t + .75) });
    o.onT = m.kick.t; o.on = () => strike(r, aimH, left, aimY);
    o.after = () => { pl.kickLock = false; pl.v = moving ? Math.min(pl.v, 3.5) : 0; };
  }
  function strike(r, aimH, left, aimY) {
    const toe = left ? pl.toes.L : pl.toes.R, tp = new THREE.Vector3(); toe.getWorldPosition(tp);
    const fx = tp.x + L / 2, fy = tp.z + W / 2, miss = Math.hypot(fx - ball.x, fy - ball.y);
    const q = clamp(1 - Math.max(0, miss - .35) * 1.4, .25, 1);   // contacto limpio o mordido
    const weak = left ? .86 : 1, p = r.p, run = pl.v > 5.5 ? .12 : 0;
    const err = (1 - q) * .35 + (1 - weak) * .3 + run + (r.fin ? -.05 : 0) + (100 - ST.sho) * .004;
    if (r.k === "shot") {
      // potencia → velocidad y altura; mucha potencia = riesgo de irse arriba
      const sp = (r.fin ? 17 + p * 9 : 16 + p * 16 + (ST.sho - 70) * .08) * (.75 + q * .25) * weak;
      const tx = L + .2, ty = aimY + (Math.random() - .5) * err * 4.2, d = Math.hypot(tx - ball.x, ty - ball.y), t = d / (sp * .93);
      const tz = clamp(.25 + p * 1.5 + (p > .82 ? (p - .82) * 6 * (1.2 - q) : 0) + (Math.random() - .5) * err * 1.4, .1, 4);
      const vz = (tz - ball.z + .5 * G * t * t) / t;
      let a = Math.atan2(ty - ball.y, tx - ball.x), wz = 0;
      if (r.fin) { const s = Math.sign(W / 2 - aimY) || 1; wz = -s * 26; const curl = .5 * .0042 * 26 * sp * t * t; a = Math.atan2(ty - s * curl * -1 - ball.y, tx - ball.x); }
      ball.vx = Math.cos(a) * sp; ball.vy = Math.sin(a) * sp; ball.vz = vz; ball.z = Math.max(ball.z, .02);
      ball.wz = wz; ball.wx = -Math.sin(a) * 5; ball.wy = Math.cos(a) * 5;
    } else {
      let sp, vz;
      if (r.k === "pass") { const d = 8 + p * 32; sp = Math.sqrt(2 * (1.4 + .3 * 8) * d) * .92 * q; vz = d > 30 ? 2.5 : 0; }
      else { const d = 12 + p * 30; sp = (7 + d * .38) * q; vz = 5.5 + d * .13; }
      const a = aimH + (Math.random() - .5) * err * .3;
      ball.vx = Math.cos(a) * sp; ball.vy = Math.sin(a) * sp; ball.vz = vz; ball.z = Math.max(ball.z, .02);
      ball.wz = 0; ball.wx = -Math.sin(a) * (r.k === "lob" ? -8 : 6); ball.wy = Math.cos(a) * (r.k === "lob" ? -8 : 6);
    }
    const sp = Math.hypot(ball.vx, ball.vy);
    sfx(140, .14, clamp(sp / 40, .1, .6), "square"); touchSfx(sp);
    dr.loose = .7; dr.plan = null;     // tras golpear, el pie no vuelve a «atrapar» el balón
    if (r.k === "shot") gkReact();
  }

  /* ---------- portero ---------- */
  let gkSt = { mode: "idle", t: 0, hold: 0 };
  function gkReact() {
    // dónde cruza el balón la línea de gol
    for (let t = .05; t < 2.5; t += .05) { const b = predictBall(t); if (b.x >= L - .3) { const onT = Math.abs(b.y - W / 2) < GW / 2 + .1 && b.z < GH + .1;
      const dy = b.y - gk.y, reach = 1.1 + Math.abs(dy) < 3.6; const spd = Math.hypot(ball.vx, ball.vy);
      const pSave = clamp(1.05 - Math.abs(dy) * .17 - Math.max(0, spd - 22) * .025 - (b.z > 1.8 && Math.abs(dy) > 1.5 ? .25 : 0), .05, .9);
      if (!onT && Math.abs(b.y - W / 2) > GW / 2 + .4) return; gkSt = { mode: "dive", react: .17 + Math.random() * .08, t, by: b.y, bz: b.z, save: onT && Math.random() < pSave, onT, dy };
      return; } }
  }
  function gkStep(dt) {
    const gx = L - 1.0;
    if (gkSt.mode === "dive" && !gk.one) {
      gkSt.t -= dt; gkSt.react -= dt; const dy = gkSt.by - gk.y, ady = Math.abs(dy), left = dy > 0;
      // estirada según altura y lado: [clip, inicio del impulso, instante de máxima extensión, alcance lateral]
      const D = ady < .7 ? (gkSt.bz > .55 ? ["GoalkeeperCatch", .35, .8, 0] : ["GoalkeeperScoop", .3, .8, 0])
        : gkSt.bz < .8 ? (left ? ["GoalkeeperBodyBlock", .45, 1.0, 1.0] : ["GoalkeeperBodyBlock1", .4, .87, .87])
        : (left ? ["GoalkeeperDivingSave1", .55, 1.27, 1.9] : ["GoalkeeperDivingSave", .52, 1.2, 2.3]);
      const ts = 1.5, tReach = (D[2] - D[1]) / ts;
      if (gkSt.t <= tReach + .04 && gkSt.react <= 0) {
        const o = startOne(gk, D[0], { ts, t0: D[1], end: Math.min(META[D[0]].dur, D[2] + 1.2), fadeIn: .06 });
        if (o) { if (!D[3]) o.rootScale = 0; o.warp = { x: 0, y: dy - Math.sign(dy) * D[3], t: D[2] - D[1] }; }
        gkSt.mode = "diving";
      }
    }
    if (gkSt.mode === "diving" || gkSt.mode === "idle") {
      // contacto real: el balón choca con las manos o el cuerpo del portero
      const b = ball, sp = Math.hypot(b.vx, b.vy, b.vz);
      if (!b.inNet && sp > 4 && b.x > gk.x - 1.2 && b.x < gk.x + .6 && (simT * 1000) - (gkSt.lastSave || 0) > 600) {
        gk.hands[0].getWorldPosition(hv); gk.hands[1].getWorldPosition(hv2);
        const hm = hv.clone().add(hv2).multiplyScalar(.5), bw = P3(b.x, b.y, b.z + BR);
        const dHands = Math.min(hv.distanceTo(bw), hv2.distanceTo(bw), hm.distanceTo(bw));
        const bodyY = clamp(bw.y, .1, 1.75), dBody = Math.hypot(b.x - gk.x, b.y - gk.y, 0) + Math.abs(bw.y - bodyY) * .6;
        if (dHands < .32 || dBody < .4) {
          if (Math.random() < .06) { /* se le escapa */ }
          else if (dHands < .3 && sp < 27 && Math.abs(b.y - gk.y) < 1.2) { b.vx = b.vy = b.vz = 0; gkSt = { mode: "hold", t: 1.6 }; msg("¡ATRAPADA!"); sfx(300, .25, .3, "triangle"); }
          else { const sd = Math.sign(b.y - gk.y) || (Math.random() < .5 ? -1 : 1); b.vx = -Math.abs(b.vx) * .22 - 2; b.vy = sd * (5 + Math.random() * 4); b.vz = 2.5 + Math.random() * 2.5; gkSt = { mode: "idle", lastSave: (simT * 1000) }; msg("¡PARADÓN!"); sfx(300, .25, .3, "triangle"); }
        }
      }
      if (!gk.one && gkSt.mode === "diving") gkSt = { mode: "idle" };
    }
    if (gkSt.mode === "hold") { if (!gk.one) startOne(gk, "GoalkeeperCatch", { t0: META.GoalkeeperCatch.dur * .93, ts: 0, end: 99, fadeIn: .2 }); gkHands(); ball.vx = ball.vy = ball.vz = 0; gkSt.t -= dt;
      if (gkSt.t <= 0) { const o = startOne(gk, "GoalkeeperOverhandThrow", { ts: 1.3, end: 2.2 }); gkSt = { mode: "throw" }; if (o) { o.handRel = true; o.hold = true; o.after = () => { if (!o.fired) { o.fired = true; o.on(); } }; o.on = () => { o.hold = false; const a = Math.atan2(pl.y - gk.y, pl.x - gk.x), d = Math.hypot(pl.x - gk.x, pl.y - gk.y); ball.vx = Math.cos(a) * (6 + d * .35); ball.vy = Math.sin(a) * (6 + d * .35); ball.vz = 3.5; ball.z = 1.6; gkSt = { mode: "idle" }; }; } } }
    // salir a por el balón: suelto en el área y llega antes que el delantero, o 1 contra 1 encimando
    gk.run = false;
    if ((gkSt.mode === "idle" || gkSt.mode === "rush") && !gk.one && !ball.inNet) {
      const inBox = ball.x > L - 16.5 && Math.abs(ball.y - W / 2) < 20.15, plHas = Math.hypot(ball.x - pl.x, ball.y - pl.y) < 1.4 && ball.z < .5;
      const bsp = Math.hypot(ball.vx, ball.vy);
      let target = null;
      if (inBox && !plHas && bsp < 16 && ball.z < 2) {
        for (let t = .1; t < 3; t += .1) { const pb = predictBall(t); const tg = Math.hypot(pb.x - gk.x, pb.y - gk.y) / 6.2 + .25, tp = Math.hypot(pb.x - pl.x, pb.y - pl.y) / Math.max(5, pl.v + 1); if (tg <= t && tg < tp * .95) { target = pb; break; } }
      } else if (inBox && plHas && Math.hypot(pl.x - gk.x, pl.y - gk.y) < 11 && pl.x > L - 14) target = { x: lerp(pl.x, gk.x, .35), y: lerp(pl.y, gk.y, .35), oneVone: true };
      if (target) {
        gkSt.mode = "rush"; const dx = target.x - gk.x, dy = target.y - gk.y, d = Math.hypot(dx, dy);
        const want = target.oneVone ? 4.5 : 6.2; gk.v = Math.min(want, d * 4); gk.run = gk.v > 1;
        if (d > .05) { gk.h += angD(gk.h, Math.atan2(dy, dx)) * Math.min(1, dt * 8); gk.x += Math.cos(gk.h) * gk.v * dt; gk.y += Math.sin(gk.h) * gk.v * dt; }
        const db = Math.hypot(ball.x - gk.x, ball.y - gk.y);
        // a por él: se tira a los pies (1 contra 1) o recoge el balón suelto
        if (db < (target.oneVone ? 2.3 : 1.4)) { const n = ball.z > .6 ? "GoalkeeperCatch" : target.oneVone ? "GoalkeeperBodyBlock1" : "GoalkeeperScoop"; const o = startOne(gk, n, { ts: 1.5, end: 1.3, fadeIn: .1 });
          if (o) { o.rootScale = 0; o.warp = { x: ball.x - gk.x - Math.cos(gk.h) * .4, y: ball.y - gk.y - Math.sin(gk.h) * .4, t: .35 }; o.onT = .35; o.on = () => { if (Math.hypot(ball.x - gk.x, ball.y - gk.y) < 1.1 && ball.z < 1.6 && Math.random() < (target.oneVone ? .72 : .97)) { ball.vx = ball.vy = ball.vz = 0; gkSt = { mode: "hold", t: 1.6 }; msg(target.oneVone ? "¡SALIDA DEL PORTERO!" : "¡LA ATRAPA!"); sfx(300, .25, .3, "triangle"); } }; }
          gkSt.mode = "idle"; }
      } else if (gkSt.mode === "rush") gkSt.mode = "idle";
    }
    if (gkSt.mode === "idle" && !gk.one) {   // colocación: en la bisectriz, adelantado según la distancia
      const db = Math.hypot(L - ball.x, W / 2 - ball.y), ty = W / 2 + clamp((ball.y - W / 2) * clamp(3.5 / Math.max(db, 1), .08, .45), -GW / 2 + .5, GW / 2 - .5), tx = L - clamp(.6 + db * .045, .6, 3);
      const dx = tx - gk.x, dy = ty - gk.y, d = Math.hypot(dx, dy), sp = Math.min(d * 3, 4.2);
      gk.x += dx / (d || 1) * sp * dt; gk.y += dy / (d || 1) * sp * dt; gk.v = 0;
      gk.h += angD(gk.h, Math.atan2(ball.y - gk.y, ball.x - gk.x)) * Math.min(1, dt * 5);
      gk.side = sp; }
    if (gk.one) stepOne(gk, dt); else gk.oneW = Math.max(0, gk.oneW - dt / .2);
    if (gkSt.mode === "throw" && gk.one && gk.one.hold) { gkHands();
      const o = gk.one; gk.hands[0].getWorldPosition(hv); const fa = (hv.x + L / 2 - gk.x) * Math.cos(gk.h) + (hv.z + W / 2 - gk.y) * Math.sin(gk.h);
      if (o.t > .6 && o.prevA != null && fa < o.prevA - .003 && o.prevA > .15 && !o.fired) { o.fired = true; o.on(); } o.prevA = fa; }
  }
  // el balón va en las manos del portero (entre las dos palmas)
  const hv = new THREE.Vector3(), hv2 = new THREE.Vector3();
  function gkHands() { gk.hands[0].getWorldPosition(hv); gk.hands[1].getWorldPosition(hv2); hv.add(hv2).multiplyScalar(.5); hv.x += Math.cos(gk.h) * .08; hv.z += Math.sin(gk.h) * .08; ball.x = hv.x + L / 2; ball.y = hv.z + W / 2; ball.z = Math.max(0, hv.y - BR); }
  const GKT = [ { n: "GoalkeeperIdle", v: 0, dur: META.GoalkeeperIdle.dur, cyc: 1, lph: 0 }, { n: "GoalkeeperSidestep", v: 2.4, dur: META.GoalkeeperSidestep.dur, cyc: 1, lph: 0 } ];

  function resetBall() { ball.x = pl.x + Math.cos(pl.h) * .6; ball.y = pl.y + Math.sin(pl.h) * .6; ball.z = 0; ball.vx = ball.vy = ball.vz = ball.wx = ball.wy = ball.wz = 0; ball.inNet = false; gkSt = { mode: "idle" }; }

  /* ---------- cámara de televisión ---------- */
  const camP = new THREE.Vector3(), camL = new THREE.Vector3(); let camInit = false;
  function camera(dt) {
    const fx = lerp(pl.x, ball.x, .45), fy = lerp(pl.y, ball.y, .45);
    const tx = clamp(fx, 14, L - 14), ty = clamp(fy, 10, W - 6);
    const want = P3(tx * .92 + L / 2 * .08, ty * .55 + W * .45 + 23, 9.8), look = P3(tx, ty + 1.5, 0); look.y = .9;
    if (window.CAMCLOSE) { const tg = window.CAMCLOSE === 'gk' ? gk : pl; const c = window.CAMCLOSE === 'gk' ? P3(tg.x - 7, tg.y + 5, 2.2) : P3(tg.x - 2.5, tg.y + 4.5, 1.6); cam.position.copy(c); cam.lookAt(P3(tg.x, tg.y, .9)); sun.position.copy(P3(pl.x - 20, pl.y - 25, 45)); sun.target.position.copy(P3(pl.x, pl.y, 0)); return; }
    if (!camInit) { camP.copy(want); camL.copy(look); camInit = true; }
    camP.lerp(want, Math.min(1, dt * 2.6)); camL.lerp(look, Math.min(1, dt * 3.5)); cam.position.copy(camP); cam.lookAt(camL);
    sun.position.copy(P3(pl.x - 20, pl.y - 25, 45)); sun.target.position.copy(P3(pl.x, pl.y, 0));
  }

  /* ---------- bucle ---------- */
  let last = performance.now(), fpsN = 0, fpsT = 0;
  resetBall(); updHud(); $("#load").remove();
  function tick(dt) {
    simT += dt;
    const I = input();
    if (resetT > 0) { resetT -= dt; if (resetT <= 0) { pl.x = 72; pl.y = W / 2 + (Math.random() - .5) * 20; pl.h = 0; pl.v = 0; resetBall(); } }
    if (celeT > 0) { celeT -= dt; if (I.cele) celebrate(); }
    kickInput(I, dt);
    movePlayer(dt, I);
    stepOne(pl, dt);
    if (pl.one && pl.one.withBall) { const tx = pl.x + Math.cos(pl.h) * .45, ty = pl.y + Math.sin(pl.h) * .45; ball.vx = (tx - ball.x) * 10; ball.vy = (ty - ball.y) * 10; ball.vz = 0; }
    dribble(dt, I);
    // el cuerpo empuja el balón (no lo atraviesa)
    { const dx = ball.x - pl.x, dy = ball.y - pl.y, d = Math.hypot(dx, dy); if (d < .32 && ball.z < .6 && !pl.kickLock) { const nx = dx / (d || 1), ny = dy / (d || 1), vn = ball.vx * nx + ball.vy * ny - pl.v * (Math.cos(pl.h) * nx + Math.sin(pl.h) * ny); if (vn < 0) { ball.vx -= vn * nx * 1.3; ball.vy -= vn * ny * 1.3; } ball.x = pl.x + nx * .32; ball.y = pl.y + ny * .32; } }
    ballStep(ball, dt);
    gkStep(dt);
    pose(pl, dt, LOCO);
    if (!gk.run) gk.v = gk.side || 0; pose(gk, dt, gk.run ? LOCO : GKT);
    place(pl, dt); place(gk, dt);
    ballMesh.position.copy(P3(ball.x, ball.y, ball.z + BR));
    const bs = Math.hypot(ball.vx, ball.vy); if (bs > .05) ballMesh.rotateOnWorldAxis(new THREE.Vector3(ball.vy, 0, -ball.vx).normalize(), -bs * dt / BR);
    for (const n of nets) { if (!(n.hit > 0)) continue; n.hit = Math.max(0, n.hit - dt * 1.4); const hp = P3(n.hx || 0, n.hy || 0, n.hz || 0), ar = n.mesh.geometry.attributes.position, wp = n.wpos, amp = Math.sin(Math.min(1, n.hit) * Math.PI * .5) * .5 * n.sgn; for (let i = 0; i < ar.count; i++) { const dx = wp[i * 3] - hp.x, dy = wp[i * 3 + 1] - hp.y, dz = wp[i * 3 + 2] - hp.z; ar.array[i * 3 + 2] = n.base[i * 3 + 2] + Math.exp(-(dx * dx + dy * dy + dz * dz) / .9) * amp; } ar.needsUpdate = true; }
    camera(dt);
    if (msgT > 0) { msgT -= dt; if (msgT <= 0) $("#msg").style.opacity = 0; }
  }
  function draw(dt) {
    const w = cv.clientWidth, h = cv.clientHeight, dpr = Math.min(devicePixelRatio || 1, maxDpr);
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { Rn.setPixelRatio(dpr); Rn.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }
    Rn.render(S, cam);
    fpsN++; fpsT += dt; if (fpsT > 1) { const f = Math.round(fpsN / fpsT); $("#fps").textContent = f + " fps"; fpsN = 0; fpsT = 0;
      // si el ordenador no llega, baja calidad sola: primero resolución, luego sombras
      if (!window.STEP && f < 45) { lowQ = (lowQ || 0) + 1; if (lowQ === 2) maxDpr = 1; if (lowQ === 4) maxDpr = .8; if (lowQ === 6) { sun.shadow.mapSize.set(1024, 1024); sun.shadow.map && sun.shadow.map.dispose(); sun.shadow.map = null; } } }
    window.__dbg = { pl: { x: pl.x, y: pl.y, h: pl.h, v: pl.v, one: pl.one && pl.one.n }, ball: { ...ball }, gk: gkSt.mode };
  }
  function frame(now) {
    const dt = Math.min(.034, (now - last) / 1000); last = now;
    if (!window.STEP) { tick(dt); draw(dt); }
    requestAnimationFrame(frame);
  }
  // modo de prueba: avanza n pasos fijos de 1/30 s y dibuja (para grabar y comprobar fotograma a fotograma)
  window.__run = (n = 1, h = 1 / 30) => { for (let i = 0; i < n; i++) tick(h); draw(h); const lg = dr.log || []; dr.log = []; return { tl: lg, pl: { x: pl.x, y: pl.y, h: pl.h, v: pl.v }, ball: { x: ball.x, y: ball.y, z: ball.z, vx: ball.vx, vy: ball.vy }, toeR: footLocal("R"), toeL: footLocal("L"), plan: dr.plan, t: simT }; };
  window.__test = { pl, ball, K, startOne, META, gk, gkReact: () => gkReact(), gkSt: () => gkSt, hold: () => { gkSt = { mode: "hold", t: 1.6 }; }, resetGk: () => { gkSt = { mode: "idle" }; gk.one = null; gk.oneW = 0; } };
  requestAnimationFrame(frame);
})().catch(e => { const d = document.querySelector("#load"); if (d) d.innerHTML = "Error: " + e.message; console.error(e); });
