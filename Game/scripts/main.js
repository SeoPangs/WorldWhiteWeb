(function(){
    // --- Utilities ---
    const $ = sel => document.querySelector(sel);
    const now = () => Date.now();
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const log = (msg) => { const el=$('#log'); const time=new Date().toLocaleTimeString(); el.insertAdjacentHTML('afterbegin', `[${time}] ${msg}<br>`); };

    // --- Game State ---
    const stateDefault = {
        v:1,
        player:{ lv:1, xp:0, xpNext:10, hp:10, hpMax:10, atk:2, def:1, gold:0, potions:0 },
        auto:false,
        exploring:false,
        zone:'meadow',
        memo:'',
    };
    let S = load() || structuredClone(stateDefault);
    let enemy = null;
    let lastTick = now();

    // --- Zones & Enemy Tables ---
    const ZONES = {
        meadow: { name:'초원', lv:[1,3], enemies:[
        { name:'슬라임', hp:[6,9], atk:[1,2], def:[0,1], gold:[1,3], xp:[2,3] },
        { name:'들쥐',   hp:[7,10], atk:[1,3], def:[0,1], gold:[1,4], xp:[2,4] },
        ] },
        forest: { name:'숲', lv:[3,6], enemies:[
        { name:'늑대', hp:[12,18], atk:[2,4], def:[1,2], gold:[3,6], xp:[4,7] },
        { name:'덤불정령', hp:[14,20], atk:[2,5], def:[1,3], gold:[3,7], xp:[5,8] },
        ] },
        ruin: { name:'폐허', lv:[6,99], enemies:[
        { name:'망령', hp:[22,30], atk:[4,7], def:[2,4], gold:[6,10], xp:[8,12] },
        { name:'수호자', hp:[26,36], atk:[5,8], def:[3,5], gold:[7,12], xp:[10,14] },
        ] },
    };
    function rndi([a,b]){ return Math.floor(Math.random()*(b-a+1))+a; }
    function spawnEnemy(){
        const z = ZONES[S.zone];
        const base = z.enemies[Math.floor(Math.random()*z.enemies.length)];
        const lvl = rndi([Math.max(1, z.lv[0]), Math.max(z.lv[0], Math.min(z.lv[1], S.player.lv+1))]);
        const e = {
        name: base.name, lv:lvl,
        hpMax: rndi(base.hp) + lvl,
        atk: rndi(base.atk) + Math.floor(lvl/2),
        def: rndi(base.def) + Math.floor(lvl/3),
        gold: rndi(base.gold) + Math.floor(lvl/2),
        xp: rndi(base.xp) + Math.floor(lvl/2),
        };
        e.hp = e.hpMax;
        return e;
    }

    // --- Save/Load ---
    function save(){ try{ if($('#autosave').checked){ localStorage.setItem('white-web-rpg', JSON.stringify(S)); } }catch(e){} }
    function load(){ try{ const x = localStorage.getItem('white-web-rpg'); return x? JSON.parse(x): null; }catch(e){ return null; } }
    function hardReset(){ localStorage.removeItem('white-web-rpg'); S = structuredClone(stateDefault); enemy=null; renderAll(); log('새 게임을 시작합니다.'); }

    // --- Rendering ---
    function renderPlayer(){
        const p=S.player; $('#lv').textContent=p.lv; $('#xp').textContent=`${p.xp} / ${p.xpNext}`;
        $('#hp').textContent=`${p.hp} / ${p.hpMax}`; $('#atk').textContent=p.atk; $('#def').textContent=p.def; $('#gold').textContent=p.gold;
        $('#hpFill').style.width = `${(p.hp/p.hpMax*100).toFixed(1)}%`;
    }
    function renderEnemy(){
        if(!enemy){ $('#enemyName').textContent='-'; $('#enemyLvl').textContent='Lv -'; $('#enemyHp').textContent='-'; $('#enemyAtk').textContent='ATK - / DEF -'; $('#enemyHpFill').style.width='0%'; return; }
        $('#enemyName').textContent=enemy.name; $('#enemyLvl').textContent=`Lv ${enemy.lv}`; $('#enemyHp').textContent=`${enemy.hp} / ${enemy.hpMax}`; $('#enemyAtk').textContent=`ATK ${enemy.atk} / DEF ${enemy.def}`;
        $('#enemyHpFill').style.width = `${(enemy.hp/enemy.hpMax*100).toFixed(1)}%`;
    }
    function renderFlags(){ $('#autoState').textContent = S.auto? 'ON':'OFF'; $('#zoneSelect').value=S.zone; $('#memo').value=S.memo || ''; }
    function renderInv(){
        const inv = $('#inv');
        inv.innerHTML = '';
        const li = (t)=>{ const e=document.createElement('li'); e.textContent=t; return e; };
        const items=[];
        if(S.player.potions>0) items.push(`포션 x${S.player.potions}`);
        if(items.length===0) items.push('인벤토리 비어있음');
        items.forEach(x=> inv.appendChild(li(x)));
    }
    function renderAll(){ renderPlayer(); renderEnemy(); renderFlags(); renderInv(); }

    // --- Combat / Progression ---
    function gainXP(n){ const p=S.player; p.xp+=n; while(p.xp>=p.xpNext){ p.xp-=p.xpNext; p.lv++; p.hpMax+=3; p.atk++; if(p.lv%2===0) p.def++; p.hp=p.hpMax; p.xpNext=Math.floor(p.xpNext*1.25)+5; log(`레벨 업! Lv ${p.lv}`); } }
    function attackOnce(){ if(!enemy){ enemy = spawnEnemy(); renderEnemy(); log(`${enemy.name}(Lv ${enemy.lv}) 등장!`); return; }
        const p=S.player;
        // Player → Enemy
        const dmgP = Math.max(1, p.atk - Math.floor(enemy.def*0.7));
        enemy.hp = clamp(enemy.hp - dmgP, 0, enemy.hpMax);
        log(`공격 ▶ ${enemy.name}에게 ${dmgP} 피해`);
        if(enemy.hp<=0){
        S.player.gold += enemy.gold; gainXP(enemy.xp);
        log(`승리! +${enemy.gold}G, +${enemy.xp}XP`);
        enemy=null; renderPlayer(); renderEnemy(); return;
        }
        // Enemy → Player
        const dmgE = Math.max(1, enemy.atk - Math.floor(p.def*0.7));
        p.hp = clamp(p.hp - dmgE, 0, p.hpMax);
        log(`반격 ◀ ${dmgE} 피해를 받음`);
        renderPlayer(); renderEnemy();
        if(p.hp<=0){ p.hp=1; S.exploring=false; S.auto=false; log('기절… 휴식이 필요합니다. 탐험이 중지됩니다.'); renderFlags(); }
    }

    function tick(){
        const nowMs = now(); if(nowMs - lastTick < 1000) return; lastTick = nowMs;
        if(S.exploring){
        // 자연 회복 소량
        if(S.player.hp < S.player.hpMax) S.player.hp = clamp(S.player.hp + 1, 0, S.player.hpMax);
        if(S.auto) attackOnce();
        renderPlayer(); save();
        }
    }

    // --- UI Handlers ---
    $('#btnExplore').onclick = ()=>{ S.exploring=!S.exploring; log(S.exploring? `${ZONES[S.zone].name} 탐험 시작`:`탐험 중지`); save(); };
    $('#zoneSelect').onchange = (e)=>{ S.zone=e.target.value; enemy=null; renderEnemy(); log(`${ZONES[S.zone].name}으로 이동`); save(); };
    $('#btnAttack').onclick = ()=> attackOnce();
    $('#btnAuto').onclick = ()=>{ S.auto=!S.auto; renderFlags(); save(); };
    $('#btnRest').onclick = ()=>{ const p=S.player; const before=p.hp; p.hp = clamp(p.hp + Math.max(2, Math.floor(p.hpMax*0.15)), 0, p.hpMax); renderPlayer(); log(`휴식: HP ${before}→${p.hp}`); save(); };
    $('#btnTrain').onclick = ()=>{ if(S.player.gold>=5){ S.player.gold-=5; S.player.atk+=1; renderPlayer(); log('훈련: ATK +1 (5G)'); save(); } else log('골드가 부족합니다(필요: 5G).'); };
    $('#btnGuard').onclick = ()=>{ if(S.player.gold>=5){ S.player.gold-=5; S.player.def+=1; renderPlayer(); log('방비: DEF +1 (5G)'); save(); } else log('골드가 부족합니다(필요: 5G).'); };
    $('#btnBuyPotion').onclick = ()=>{ if(S.player.gold>=5){ S.player.gold-=5; S.player.potions++; renderInv(); renderPlayer(); log('포션 구매 +1 (5G)'); save(); } else log('골드가 부족합니다(필요: 5G).'); };
    $('#btnUsePotion').onclick = ()=>{ if(S.player.potions>0){ S.player.potions--; const p=S.player; const before=p.hp; p.hp = clamp(p.hp + Math.ceil(p.hpMax*0.5), 0, p.hpMax); renderInv(); renderPlayer(); log(`포션 사용: HP ${before}→${p.hp}`); save(); } else log('포션이 없습니다.'); };

    $('#btnExport').onclick = ()=>{
        const blob = new Blob([JSON.stringify(S)], {type:'application/json'});
        const a = document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='white-web-rpg-save.json'; a.click(); URL.revokeObjectURL(a.href);
    };
    $('#btnImport').onclick = ()=>{
        const inp = document.createElement('input'); inp.type='file'; inp.accept='application/json'; inp.onchange = async()=>{
        const file = inp.files[0]; if(!file) return; const text = await file.text();
        try{ const loaded = JSON.parse(text); if(loaded && loaded.player){ S = Object.assign(structuredClone(stateDefault), loaded); enemy=null; renderAll(); save(); log('세이브 불러오기 완료.'); } else { log('잘못된 저장 파일입니다.'); } }
        catch{ log('불러오기 실패(파일 형식 오류).'); }
        }; inp.click();
    };
    $('#btnReset').onclick = ()=>{ if(confirm('정말 새 게임을 시작할까요? 저장이 초기화됩니다.')) hardReset(); };
    $('#autosave').onchange = save;
    $('#memo').oninput = ()=>{ S.memo = $('#memo').value; save(); };

    // Keyboard shortcuts for quick play
    document.addEventListener('keydown', (e)=>{
        if(e.repeat) return;
        if(e.key===' '){ e.preventDefault(); attackOnce(); }
        else if(e.key==='a' || e.key==='A'){ S.auto=!S.auto; renderFlags(); save(); log(`자동 전투: ${S.auto?'ON':'OFF'}`); }
        else if(e.key==='e' || e.key==='E'){ S.exploring=!S.exploring; log(S.exploring? '탐험 시작':'탐험 중지'); }
        else if(e.key==='r' || e.key==='R'){ $('#btnRest').click(); }
        else if(e.key==='p' || e.key==='P'){ $('#btnUsePotion').click(); }
    });

    // Main loop
    renderAll();
    log('환영합니다! 스페이스바=공격, A=자동전투, E=탐험 토글, R=휴식, P=포션');
    setInterval(tick, 250);
})();