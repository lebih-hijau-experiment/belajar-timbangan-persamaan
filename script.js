/* ===================== COBA & COCOKKAN (quiz) ===================== */
(function(){
  "use strict";

  function heartSVG(color){
    return '<svg viewBox="0 0 32 29"><path d="M16 29 C6 21 0 15 0 8.5 C0 3.8 3.8 0 8.5 0 C11.9 0 14.6 2 16 4.9 C17.4 2 20.1 0 23.5 0 C28.2 0 32 3.8 32 8.5 C32 15 26 21 16 29 Z" fill="' + color + '"/></svg>';
  }

  function ballHTML(item, big){
    var cls = 'item item-' + item.shape + (big ? ' item-big' : '');
    if(item.shape === 'letter'){
      return '<div class="' + cls + '" style="background:' + item.color + '">' + item.key + '</div>';
    }
    if(item.shape === 'heart'){
      return '<div class="' + cls + '">' + heartSVG(item.color) + '</div>';
    }
    return '<div class="' + cls + '" style="background:' + item.color + '"></div>';
  }

  function itemName(item){
    return item.shape === 'letter' ? ('huruf ' + item.key) : ('bentuk ' + item.label);
  }

  function scaleCardHTML(caseData, pair, index){
    var left = caseData.items[pair.left];
    var right = caseData.items[pair.right];
    return '<div class="scale-card" data-pair="' + index + '" id="' + caseData.id + '-scale-' + index + '">' +
      '<span class="scale-index">' + (index + 1) + '</span>' +
      '<div class="balls">' + ballHTML(left) + ballHTML(right) + '</div>' +
      '<div class="scale-body"><div class="display">' + pair.total + ' g</div></div>' +
    '</div>';
  }

  function questionBlockHTML(caseData){
    var target = caseData.items[caseData.target];
    return '<div class="question-row">' +
      '<div class="target-icon">' + ballHTML(target, true) + '</div>' +
      '<p class="question-text">Berapa berat ' + itemName(target) + ' ini?</p>' +
    '</div>' +
    '<div class="options">' +
      caseData.options.map(function(v){
        return '<button type="button" class="opt-btn" data-value="' + v + '">' + v + ' g</button>';
      }).join('') +
    '</div>';
  }

  function evaluateGuess(caseData, guess){
    var withPairs = [], checkIndex = -1, checkTotal = 0;
    caseData.pairs.forEach(function(p, i){
      if(p.left === caseData.target || p.right === caseData.target){
        withPairs.push({ left:p.left, right:p.right, total:p.total });
      } else {
        checkIndex = i;
        checkTotal = p.total;
      }
    });
    var parts = withPairs.map(function(p){
      var otherKey = (p.left === caseData.target) ? p.right : p.left;
      return { key: otherKey, val: p.total - guess, total: p.total };
    });
    var sum = parts[0].val + parts[1].val;
    return { parts: parts, checkIndex: checkIndex, checkTotal: checkTotal, sum: sum, correct: sum === checkTotal };
  }

  function buildFeedbackHTML(caseData, guess, result){
    var target = caseData.items[caseData.target];
    var p0 = result.parts[0], p1 = result.parts[1];
    var name0 = itemName(caseData.items[p0.key]);
    var name1 = itemName(caseData.items[p1.key]);
    var tName = itemName(target);
    var html = '<p>Kalau ' + tName + ' = <strong>' + guess + ' g</strong>:</p>';
    html += '<ul>' +
      '<li>' + name0 + ' = ' + p0.total + ' − ' + guess + ' = <strong>' + p0.val + ' g</strong></li>' +
      '<li>' + name1 + ' = ' + p1.total + ' − ' + guess + ' = <strong>' + p1.val + ' g</strong></li>' +
    '</ul>';
    html += '<p>Cek Timbangan ' + (result.checkIndex + 1) + ': ' + p0.val + ' + ' + p1.val + ' = <strong>' + result.sum + ' g</strong>. ';
    if(result.correct){
      html += 'Timbangan itu juga menunjukkan ' + result.checkTotal + ' g. Cocok! ✅</p>';
      html += '<div class="stamp">KASUS TERPECAHKAN! 🎉<br>' + tName + ' = ' + guess + ' gram</div>';
    } else {
      html += 'Tapi timbangan itu menunjukkan ' + result.checkTotal + ' g, jadi belum cocok. ❌</p>' +
              '<p>Coba tebak angka lain, yuk!</p>';
    }
    return html;
  }

  var solvedCount = 0;
  function markStarSolved(idx){
    var star = document.querySelector('.progress-star[data-idx="' + idx + '"]');
    if(star && star.textContent === '☆'){
      star.textContent = '★';
      solvedCount++;
      document.getElementById('progress-text').textContent = solvedCount + ' dari 3 kasus terpecahkan';
    }
  }

  function renderCase(container, caseData){
    var html = '';
    if(caseData.title){ html += '<h3 class="case-title">' + caseData.title + '</h3>'; }
    if(caseData.steps){
      html += '<div class="step"><span class="step-num">1</span><div><strong>' + caseData.steps.s1t + '</strong><p>' + caseData.steps.s1d + '</p></div></div>';
    }
    html += '<div class="scales-grid">' + caseData.pairs.map(function(p, i){ return scaleCardHTML(caseData, p, i); }).join('') + '</div>';
    if(caseData.steps){
      html += '<div class="step"><span class="step-num">2</span><div><strong>' + caseData.steps.s2t + '</strong><p>' + caseData.steps.s2d + '</p></div></div>';
    }
    html += questionBlockHTML(caseData);
    if(caseData.steps){
      html += '<div class="step"><span class="step-num">3</span><div><strong>' + caseData.steps.s3t + '</strong><p>' + caseData.steps.s3d + '</p></div></div>';
    }
    html += '<div class="feedback hidden"></div>';
    container.innerHTML = html;

    var optionsEl = container.querySelector('.options');
    var feedbackEl = container.querySelector('.feedback');

    optionsEl.querySelectorAll('.opt-btn').forEach(function(btn){
      btn.addEventListener('click', function(){
        var guess = Number(btn.dataset.value);
        optionsEl.querySelectorAll('.opt-btn').forEach(function(b){ b.classList.remove('selected', 'correct', 'wrong'); });
        var result = evaluateGuess(caseData, guess);
        btn.classList.add('selected', result.correct ? 'correct' : 'wrong');

        container.querySelectorAll('.scale-card').forEach(function(c){ c.classList.remove('correct', 'wrong'); });
        var checkCard = container.querySelector('.scale-card[data-pair="' + result.checkIndex + '"]');
        if(checkCard){ checkCard.classList.add(result.correct ? 'correct' : 'wrong'); }

        feedbackEl.classList.remove('hidden');
        feedbackEl.innerHTML = buildFeedbackHTML(caseData, guess, result);

        if(result.correct && caseData.isPractice){
          markStarSolved(caseData.starIndex);
        }
      });
    });
  }

  var CASES = {
    tutorial: {
      id: 'tutorial',
      items: {
        A: { key:'A', shape:'letter', color:'#FF6B9D' },
        B: { key:'B', shape:'letter', color:'#4EA8DE' },
        C: { key:'C', shape:'letter', color:'#FFC93C' }
      },
      pairs: [
        { left:'A', right:'B', total:50 },
        { left:'A', right:'C', total:60 },
        { left:'B', right:'C', total:70 }
      ],
      target: 'B',
      options: [20, 30, 40, 50],
      steps: {
        s1t: 'Lihat tiga timbangan',
        s1d: 'Setiap timbangan menimbang dua bola sekaligus. Perhatikan angka di layarnya.',
        s2t: 'Tebak salah satu berat',
        s2d: 'Bola B belum diketahui beratnya. Pilih salah satu angka yang menurutmu paling pas.',
        s3t: 'Cocokkan ke timbangan ketiga',
        s3d: 'Begitu kamu memilih, kita hitung berat bola lain dan mengeceknya ke timbangan yang tersisa.'
      }
    },
    p1: {
      id: 'p1',
      title: 'Kasus 1: Huruf Rahasia',
      items: {
        X: { key:'X', shape:'letter', color:'#FF6B9D' },
        Y: { key:'Y', shape:'letter', color:'#4EA8DE' },
        Z: { key:'Z', shape:'letter', color:'#FFC93C' }
      },
      pairs: [
        { left:'X', right:'Y', total:45 },
        { left:'X', right:'Z', total:55 },
        { left:'Y', right:'Z', total:50 }
      ],
      target: 'Y',
      options: [15, 20, 25, 30],
      isPractice: true, starIndex: 0
    },
    p2: {
      id: 'p2',
      title: 'Kasus 2: Bentuk Warna-Warni',
      items: {
        O: { key:'O', shape:'circle', color:'#4EA8DE', label:'bulat' },
        S: { key:'S', shape:'square', color:'#2B2D42', label:'kotak' },
        T: { key:'T', shape:'triangle', color:'#FB8B24', label:'segitiga' }
      },
      pairs: [
        { left:'O', right:'S', total:35 },
        { left:'O', right:'T', total:50 },
        { left:'S', right:'T', total:45 }
      ],
      target: 'S',
      options: [10, 15, 20, 25],
      isPractice: true, starIndex: 1
    },
    p3: {
      id: 'p3',
      title: 'Kasus 3: Simbol Cinta',
      items: {
        H: { key:'H', shape:'heart', color:'#FF477E', label:'love' },
        O2: { key:'O2', shape:'circle', color:'#4EA8DE', label:'bulat' },
        T2: { key:'T2', shape:'triangle', color:'#FB8B24', label:'segitiga' }
      },
      pairs: [
        { left:'H', right:'O2', total:60 },
        { left:'H', right:'T2', total:70 },
        { left:'O2', right:'T2', total:50 }
      ],
      target: 'H',
      options: [30, 35, 40, 45],
      isPractice: true, starIndex: 2
    }
  };

  renderCase(document.getElementById('tutorial'), CASES.tutorial);
  renderCase(document.getElementById('p1'), CASES.p1);
  renderCase(document.getElementById('p2'), CASES.p2);
  renderCase(document.getElementById('p3'), CASES.p3);
})();


/* ===================== TRIK CEPAT (formula walkthrough) ===================== */
(function(){
  "use strict";

  function ball(letter, color, size){
    var cls = 'item item-circle' + (size ? ' item-' + size : '');
    return '<div class="' + cls + '" style="background:' + color + '">' + letter + '</div>';
  }
  var colA = '#FF6B9D', colB = '#4EA8DE', colC = '#FFC93C';

  function scaleCard(l1, c1, l2, c2, total){
    return '<div class="scale-card">' +
      '<div class="balls">' + ball(l1, c1) + ball(l2, c2) + '</div>' +
      '<div class="scale-body"><div class="display">' + total + ' g</div></div>' +
    '</div>';
  }

  var STAGES = [
    {
      title: 'Kumpulkan 3 Timbangan',
      caption: 'Kita punya 3 timbangan: A+B=50, A+C=60, dan B+C=70.',
      render: function(el){
        el.innerHTML = '<div class="scales-grid">' +
          scaleCard('A', colA, 'B', colB, 50) +
          scaleCard('A', colA, 'C', colC, 60) +
          scaleCard('B', colB, 'C', colC, 70) +
        '</div>';
      }
    },
    {
      title: 'Jumlahkan Semuanya',
      caption: 'Jumlahkan angka di ketiga timbangan: 50 + 60 + 70 = 180 gram.',
      render: function(el){
        el.innerHTML = '<div class="eq-row">' +
          '<span class="chip">50</span><span class="op">+</span>' +
          '<span class="chip">60</span><span class="op">+</span>' +
          '<span class="chip">70</span><span class="op">=</span>' +
          '<span class="chip chip-lg chip-highlight">180 g</span>' +
        '</div>';
      }
    },
    {
      title: 'Kenapa Dibagi Dua?',
      caption: 'Setiap huruf muncul dua kali di ketiga timbangan itu. Jadi 180 gram itu 2 kali berat A+B+C.',
      render: function(el){
        el.innerHTML =
          '<div class="mini-eqs">' +
            '<div class="mini-eq">' + ball('A', colA, 'sm') + '<span class="op">+</span>' + ball('B', colB, 'sm') + '<span class="op">=</span><span class="chip">50</span></div>' +
            '<div class="mini-eq">' + ball('A', colA, 'sm') + '<span class="op">+</span>' + ball('C', colC, 'sm') + '<span class="op">=</span><span class="chip">60</span></div>' +
            '<div class="mini-eq">' + ball('B', colB, 'sm') + '<span class="op">+</span>' + ball('C', colC, 'sm') + '<span class="op">=</span><span class="chip">70</span></div>' +
          '</div>' +
          '<div class="tally">' +
            '<div class="tally-group"><div class="balls-inline">' + ball('A', colA, 'sm') + ball('A', colA, 'sm') + '</div><span>muncul 2×</span></div>' +
            '<div class="tally-group"><div class="balls-inline">' + ball('B', colB, 'sm') + ball('B', colB, 'sm') + '</div><span>muncul 2×</span></div>' +
            '<div class="tally-group"><div class="balls-inline">' + ball('C', colC, 'sm') + ball('C', colC, 'sm') + '</div><span>muncul 2×</span></div>' +
          '</div>' +
          '<div class="eq-row"><span class="chip chip-lg">180</span><span class="op">=</span><span class="chip">2</span><span class="op">×</span><span class="chip">(A+B+C)</span></div>';
      }
    },
    {
      title: 'Bagi Dua, lalu Kurangi',
      caption: '180 ÷ 2 = 90 (total A+B+C). Timbangan tanpa B adalah A+C = 60. Maka 90 − 60 = 30.',
      render: function(el){
        el.innerHTML =
          '<div class="eq-row"><span class="chip">180</span><span class="op">÷</span><span class="chip">2</span><span class="op">=</span><span class="chip chip-lg chip-highlight">90 g</span></div>' +
          '<div class="mini-eq" style="margin-top:6px;">' + ball('A', colA, 'sm') + '<span class="op">+</span>' + ball('C', colC, 'sm') + '<span class="op">=</span><span class="chip">60</span><span class="chip-flag">tanpa B</span></div>' +
          '<div class="eq-row" style="margin-top:8px;"><span class="chip">90</span><span class="op">−</span><span class="chip">60</span><span class="op">=</span><span class="chip chip-lg chip-highlight">30 g</span></div>';
      }
    },
    {
      title: 'Jawaban Ditemukan!',
      caption: 'Berat Bola B = 30 gram!',
      render: function(el){
        el.innerHTML =
          ball('B', colB, 'lg') +
          '<div class="chip chip-lg chip-highlight" style="margin-top:8px;">30 g</div>' +
          '<div class="stamp">KASUS TERPECAHKAN! 🎉</div>';
      }
    }
  ];

  var current = 0;
  var dotsEl = document.getElementById('stage-dots');
  var titleEl = document.getElementById('stage-title');
  var bodyEl = document.getElementById('stage-body');
  var captionEl = document.getElementById('stage-caption');
  var counterEl = document.getElementById('stage-counter');
  var prevBtn = document.getElementById('prevBtn');
  var nextBtn = document.getElementById('nextBtn');

  STAGES.forEach(function(_, i){
    var d = document.createElement('button');
    d.type = 'button';
    d.className = 'dot';
    d.setAttribute('aria-label', 'Langkah ' + (i + 1));
    d.addEventListener('click', function(){ goTo(i); });
    dotsEl.appendChild(d);
  });

  function goTo(i){
    current = Math.max(0, Math.min(STAGES.length - 1, i));
    var stage = STAGES[current];
    titleEl.textContent = stage.title;
    bodyEl.classList.remove('stage-enter');
    void bodyEl.offsetWidth;
    stage.render(bodyEl);
    bodyEl.classList.add('stage-enter');
    captionEl.textContent = stage.caption;
    counterEl.textContent = (current + 1) + ' / ' + STAGES.length;
    dotsEl.querySelectorAll('.dot').forEach(function(d, idx){ d.classList.toggle('active', idx === current); });
    prevBtn.disabled = current === 0;
    nextBtn.disabled = current === STAGES.length - 1;
  }

  prevBtn.addEventListener('click', function(){ goTo(current - 1); });
  nextBtn.addEventListener('click', function(){ goTo(current + 1); });

  goTo(0);
})();


/* ===================== RANTAI KONVERSI (chain conversion) ===================== */
(function(){
  "use strict";

  var kotak = { shape:'square', color:'#2B2D42' };
  var segitiga = { shape:'triangle', color:'#FB8B24' };
  var bulat = { shape:'circle', color:'#4EA8DE' };
  var love = { shape:'heart', color:'#FF477E' };

  function heartSVG(color){
    return '<svg viewBox="0 0 32 29"><path d="M16 29 C6 21 0 15 0 8.5 C0 3.8 3.8 0 8.5 0 C11.9 0 14.6 2 16 4.9 C17.4 2 20.1 0 23.5 0 C28.2 0 32 3.8 32 8.5 C32 15 26 21 16 29 Z" fill="' + color + '"/></svg>';
  }

  function itemHTML(it, size){
    var cls = 'item item-' + it.shape + (size ? ' item-' + size : '');
    if(it.shape === 'heart'){ return '<div class="' + cls + '">' + heartSVG(it.color) + '</div>'; }
    return '<div class="' + cls + '" style="background:' + it.color + '"></div>';
  }

  function repeat(it, n, size){
    var out = '';
    for(var i = 0; i < n; i++){ out += itemHTML(it, size); }
    return out;
  }

  function pan(html){ return '<div class="pan">' + html + '</div>'; }
  function gramPan(value){ return '<div class="pan"><span class="chip">' + value + ' g</span></div>'; }

  function balanceHTML(leftHTML, rightHTML, highlighted){
    return '<div class="balance' + (highlighted ? ' highlight' : '') + '">' +
      '<div class="balance-row">' + pan(leftHTML) + '<span class="balance-eq">=</span>' + rightHTML + '</div>' +
      '<div class="fulcrum"></div>' +
    '</div>';
  }

  var STAGES = [
    {
      title: 'Kumpulkan Timbangan Berantai',
      caption: 'Kita punya 3 timbangan berantai: Kotak, Segitiga, dan Bulat saling berhubungan — hanya timbangan terakhir yang punya angka gram.',
      render: function(el){
        el.innerHTML =
          balanceHTML(repeat(kotak, 1), pan(repeat(segitiga, 2))) +
          balanceHTML(repeat(segitiga, 1), pan(repeat(bulat, 3))) +
          balanceHTML(repeat(bulat, 2), gramPan(30));
      }
    },
    {
      title: 'Mulai dari Angka yang Pasti',
      caption: 'Mulai dari timbangan yang sudah punya angka gram: 2 Bulat = 30 g, jadi 1 Bulat = 15 gram.',
      render: function(el){
        el.innerHTML =
          balanceHTML(repeat(bulat, 2), gramPan(30), true) +
          '<div class="eq-row"><span class="chip">30</span><span class="op">÷</span><span class="chip">2</span><span class="op">=</span><span class="chip chip-lg chip-highlight">15 g</span></div>';
      }
    },
    {
      title: 'Lompat Lewat Jembatan Bulat',
      caption: 'Bulat adalah jembatannya! 1 Segitiga = 3 Bulat = 3 × 15 = 45 gram.',
      render: function(el){
        el.innerHTML =
          balanceHTML(repeat(segitiga, 1), pan(repeat(bulat, 3)), true) +
          '<div class="eq-row"><span class="chip">15</span><span class="op">×</span><span class="chip">3</span><span class="op">=</span><span class="chip chip-lg chip-highlight">45 g</span></div>';
      }
    },
    {
      title: 'Lompat Lewat Jembatan Segitiga',
      caption: 'Segitiga adalah jembatan berikutnya! 1 Kotak = 2 Segitiga = 2 × 45 = 90 gram.',
      render: function(el){
        el.innerHTML =
          balanceHTML(repeat(kotak, 1), pan(repeat(segitiga, 2)), true) +
          '<div class="eq-row"><span class="chip">45</span><span class="op">×</span><span class="chip">2</span><span class="op">=</span><span class="chip chip-lg chip-highlight">90 g</span></div>';
      }
    },
    {
      title: 'Jawaban Ditemukan!',
      caption: 'Berat 1 Kotak = 90 gram!',
      render: function(el){
        el.innerHTML =
          itemHTML(kotak, 'lg') +
          '<div class="chip chip-lg chip-highlight" style="margin-top:8px;">90 g</div>' +
          '<div class="stamp">KASUS TERPECAHKAN! 🎉</div>';
      }
    }
  ];

  function initStepper(ids, stages){
    var current = 0;
    var dotsEl = document.getElementById(ids.dots);
    var titleEl = document.getElementById(ids.title);
    var bodyEl = document.getElementById(ids.body);
    var captionEl = document.getElementById(ids.caption);
    var counterEl = document.getElementById(ids.counter);
    var prevBtn = document.getElementById(ids.prev);
    var nextBtn = document.getElementById(ids.next);

    stages.forEach(function(_, i){
      var d = document.createElement('button');
      d.type = 'button';
      d.className = 'dot';
      d.setAttribute('aria-label', 'Langkah ' + (i + 1));
      d.addEventListener('click', function(){ goTo(i); });
      dotsEl.appendChild(d);
    });

    function goTo(i){
      current = Math.max(0, Math.min(stages.length - 1, i));
      var stage = stages[current];
      titleEl.textContent = stage.title;
      bodyEl.classList.remove('stage-enter');
      void bodyEl.offsetWidth;
      stage.render(bodyEl);
      bodyEl.classList.add('stage-enter');
      captionEl.textContent = stage.caption;
      counterEl.textContent = (current + 1) + ' / ' + stages.length;
      dotsEl.querySelectorAll('.dot').forEach(function(d, idx){ d.classList.toggle('active', idx === current); });
      prevBtn.disabled = current === 0;
      nextBtn.disabled = current === stages.length - 1;
    }

    prevBtn.addEventListener('click', function(){ goTo(current - 1); });
    nextBtn.addEventListener('click', function(){ goTo(current + 1); });

    goTo(0);
  }

  initStepper({
    dots:'chain-stage-dots', title:'chain-stage-title', body:'chain-stage-body',
    caption:'chain-stage-caption', counter:'chain-stage-counter', prev:'chain-prevBtn', next:'chain-nextBtn'
  }, STAGES);

  /* ---------- Real-problem example: Kelinci - Tupai - Itik - Anak Ayam ---------- */
  function emoji(symbol, size){
    return '<span class="emoji-icon' + (size ? ' emoji-' + size : '') + '">' + symbol + '</span>';
  }
  function repeatEmoji(symbol, n, size){
    var out = '';
    for(var i = 0; i < n; i++){ out += emoji(symbol, size); }
    return out;
  }
  function figLabel(text){ return '<div class="balance-label">' + text + '</div>'; }

  var rabbit = '🐇', squirrel = '🐿️', duckling = '🦆', chick = '🐤';

  var STAGES_ANIMALS = [
    {
      title: 'Kumpulkan 3 Timbangan + 1 Pertanyaan',
      caption: 'Ada 3 timbangan yang diketahui, dan 1 pertanyaan: berapa Anak Ayam beratnya sama dengan 1 Kelinci?',
      render: function(el){
        el.innerHTML =
          balanceHTML(repeatEmoji(rabbit, 1), pan(repeatEmoji(squirrel, 3))) + figLabel('Gambar 1') +
          balanceHTML(repeatEmoji(squirrel, 1), pan(repeatEmoji(duckling, 3))) + figLabel('Gambar 2') +
          balanceHTML(repeatEmoji(duckling, 1), pan(repeatEmoji(chick, 2))) + figLabel('Gambar 3') +
          '<div class="balance question">' +
            '<div class="balance-row">' + pan(repeatEmoji(rabbit, 1)) + '<span class="balance-eq">=</span>' + pan('<span class="emoji-icon">❓</span>' + emoji(chick, 1)) + '</div>' +
            '<div class="fulcrum"></div>' +
          '</div>' + figLabel('Gambar 4 — yang ditanyakan');
      }
    },
    {
      title: 'Kelinci ke Tupai',
      caption: 'Rasio pertama: 1 Kelinci = 3 Tupai.',
      render: function(el){
        el.innerHTML = balanceHTML(repeatEmoji(rabbit, 1), pan(repeatEmoji(squirrel, 3)), true);
      }
    },
    {
      title: 'Tupai ke Itik (Lewat Jembatan Tupai)',
      caption: 'Tupai adalah jembatannya! 3 Tupai = 3 × 3 = 9 Itik.',
      render: function(el){
        el.innerHTML =
          balanceHTML(repeatEmoji(squirrel, 1), pan(repeatEmoji(duckling, 3)), true) +
          '<div class="eq-row"><span class="chip">3 Tupai</span><span class="op">=</span><span class="chip">3×3</span><span class="op">=</span><span class="chip chip-lg chip-highlight">9 Itik</span></div>';
      }
    },
    {
      title: 'Itik ke Anak Ayam (Lewat Jembatan Itik)',
      caption: 'Itik adalah jembatan berikutnya! 9 Itik = 9 × 2 = 18 Anak Ayam.',
      render: function(el){
        el.innerHTML =
          balanceHTML(repeatEmoji(duckling, 1), pan(repeatEmoji(chick, 2)), true) +
          '<div class="eq-row"><span class="chip">9 Itik</span><span class="op">=</span><span class="chip">9×2</span><span class="op">=</span><span class="chip chip-lg chip-highlight">18 Anak Ayam</span></div>';
      }
    },
    {
      title: 'Jawaban Ditemukan!',
      caption: '1 Kelinci = 18 Anak Ayam!',
      render: function(el){
        el.innerHTML =
          emoji(rabbit, 'lg') +
          '<div class="chip chip-lg chip-highlight" style="margin-top:8px;">18 Anak Ayam</div>' +
          '<div class="stamp">KASUS TERPECAHKAN! 🎉</div>';
      }
    }
  ];

  initStepper({
    dots:'chain-stage-dots-b', title:'chain-stage-title-b', body:'chain-stage-body-b',
    caption:'chain-stage-caption-b', counter:'chain-stage-counter-b', prev:'chain-prevBtn-b', next:'chain-nextBtn-b'
  }, STAGES_ANIMALS);

  /* ---------- Static "no gram" example ---------- */
  var noGramEl = document.getElementById('chain-no-gram-case');
  noGramEl.innerHTML =
    '<p><strong>Contoh:</strong> 1 Love = 3 Kotak, dan 1 Kotak = 2 Bulat. Berapa Bulat beratnya sama dengan 1 Love?</p>' +
    balanceHTML(repeat(love, 1), pan(repeat(kotak, 3))) +
    balanceHTML(repeat(kotak, 1), pan(repeat(bulat, 2))) +
    '<div class="eq-row" style="margin-top:10px;"><span class="chip">3</span><span class="op">×</span><span class="chip">2</span><span class="op">=</span><span class="chip chip-lg chip-highlight">6 Bulat</span></div>' +
    '<p>Tidak perlu cari angka gram sama sekali — langsung kalikan rasio Love→Kotak dengan Kotak→Bulat.</p>';
})();


/* ===================== VIEW ROUTER (home / quiz / trick / chain) ===================== */
(function(){
  "use strict";
  var views = document.querySelectorAll('.view');

  function showView(name){
    views.forEach(function(v){ v.classList.toggle('active', v.id === 'view-' + name); });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  document.querySelectorAll('[data-target]').forEach(function(btn){
    btn.addEventListener('click', function(){ showView(btn.dataset.target); });
  });
})();
