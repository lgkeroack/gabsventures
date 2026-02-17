/* =========================================
   Gab's Ventures — Interactions
   Vanilla JS. No dependencies.
   ========================================= */

(function () {
  'use strict';

  // --- Scroll Reveal ---
  var revealObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );

  document.querySelectorAll('.reveal').forEach(function (el) {
    revealObserver.observe(el);
  });


  // --- Nav Scroll Effect ---
  var nav = document.querySelector('.nav');
  var ticking = false;

  function updateNav() {
    nav.classList.toggle('scrolled', window.scrollY > 60);
    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) {
      requestAnimationFrame(updateNav);
      ticking = true;
    }
  }, { passive: true });


  // --- Newsletter Banner ---
  var banner = document.getElementById('banner');
  var bannerClose = document.getElementById('banner-close');

  if (banner && !localStorage.getItem('banner-dismissed')) {
    banner.hidden = false;
  }

  if (bannerClose) {
    bannerClose.addEventListener('click', function () {
      banner.hidden = true;
      localStorage.setItem('banner-dismissed', '1');
    });
  }


  // --- Theme Toggle ---
  var themeToggle = document.getElementById('theme-toggle');
  var nightModeActive = false;

  if (localStorage.getItem('theme') === 'light') {
    document.body.classList.add('light-mode');
    themeToggle.textContent = 'dark';
  }

  themeToggle.addEventListener('click', function () {
    if (nightModeActive) return;
    document.body.classList.toggle('light-mode');
    var isLightNow = document.body.classList.contains('light-mode');
    themeToggle.textContent = isLightNow ? 'dark' : 'light';
    localStorage.setItem('theme', isLightNow ? 'light' : 'dark');
  });


  // --- Smooth Scroll for Nav Links ---
  document.querySelectorAll('.nav-links a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var target = document.querySelector(link.getAttribute('href'));
      if (target) {
        e.preventDefault();
        var navHeight = nav.offsetHeight;
        var y = target.getBoundingClientRect().top + window.scrollY - navHeight - 16;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    });
  });


  // --- Theme Helper ---
  function isLight() {
    return document.body.classList.contains('light-mode');
  }


  // --- Night Mode ---
  function isNight(sunrise, sunset) {
    if (!sunrise || !sunset) return false;
    var now = new Date();
    var rise = new Date(sunrise);
    var set = new Date(sunset);
    return now < rise || now > set;
  }

  function applyNightMode(sunrise, sunset) {
    if (isNight(sunrise, sunset)) {
      nightModeActive = true;
      document.body.classList.remove('light-mode');
      themeToggle.textContent = 'light';
      themeToggle.disabled = true;
      localStorage.setItem('theme', 'dark');
    } else {
      nightModeActive = false;
      themeToggle.disabled = false;
    }
  }


  // --- Squamish Weather Service ---
  var WEATHER_KEY = 'squamish-weather';
  var WEATHER_TTL = 4 * 60 * 60 * 1000;

  function resolveCondition(code) {
    if (code >= 71 && code <= 77 || code === 85 || code === 86) return 'snow';
    if (code >= 51 && code <= 67 || code >= 80 && code <= 82 || code >= 95) return 'rain';
    if (code >= 2 && code <= 3 || code === 45 || code === 48) return 'cloudy';
    return 'sunny';
  }

  var SQUAMISH_FORECAST = 'https://www.theweathernetwork.com/ca/weather/british-columbia/squamish';

  function applyWeather(condition, sunrise, sunset) {
    // Update footer text
    var el = document.getElementById('weather-status');
    if (el) {
      var labels = { rain: 'raining', snow: 'snowing', cloudy: 'cloudy', sunny: 'sunny' };
      var word = labels[condition] || 'sunny';
      el.innerHTML = "It's " + word + " because it's <a href=\"" + SQUAMISH_FORECAST + "\" target=\"_blank\" rel=\"noopener\">" + word + "</a>";
    }

    // Apply night mode (forces dark, disables toggle)
    applyNightMode(sunrise, sunset);

    var night = isNight(sunrise, sunset);

    // Night + sunny = starry sky only
    if (night && condition === 'sunny') {
      createStarrySky();
      return;
    }

    // Night + weather = weather overlay only (no stars)
    if (night && condition === 'rain') { createRain(); return; }
    if (night && condition === 'snow') { createSnow(); return; }
    if (night && condition === 'cloudy') { createClouds(); return; }

    // Daytime animations
    if (condition === 'rain') createRain();
    if (condition === 'snow') createSnow();
    if (condition === 'cloudy') createClouds();
    if (condition === 'sunny') createSunny();
  }

  function updateWeather() {
    var cached = localStorage.getItem(WEATHER_KEY);
    if (cached) {
      try {
        var parsed = JSON.parse(cached);
        if (Date.now() - parsed.ts < WEATHER_TTL) {
          applyWeather(parsed.condition, parsed.sunrise, parsed.sunset);
          return;
        }
      } catch (e) { /* ignore */ }
    }

    fetch('https://api.open-meteo.com/v1/forecast?latitude=49.7016&longitude=-123.1558&current=weather_code&daily=sunrise,sunset&forecast_days=1&timezone=America/Vancouver')
      .then(function (res) { return res.json(); })
      .then(function (json) {
        var condition = resolveCondition(json.current.weather_code);
        var sunrise = json.daily.sunrise[0];
        var sunset = json.daily.sunset[0];
        localStorage.setItem(WEATHER_KEY, JSON.stringify({
          condition: condition,
          sunrise: sunrise,
          sunset: sunset,
          ts: Date.now()
        }));
        applyWeather(condition, sunrise, sunset);
      })
      .catch(function () { /* fail silently */ });
  }

  updateWeather();


  // --- Rain Animation ---
  function createRain() {
    var canvas = document.createElement('canvas');
    canvas.id = 'rain-canvas';
    document.body.appendChild(canvas);

    var ctx = canvas.getContext('2d');
    var drops = [];
    var splashes = [];
    var DROP_COUNT = 200;
    var w, h;

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w;
      canvas.height = h;
    }
    resize();
    window.addEventListener('resize', resize);

    function makeDrop() {
      return {
        x: Math.random() * w * 1.2 - w * 0.1,
        y: -10 - Math.random() * h * 0.5,
        len: 10 + Math.random() * 12,
        speed: 14 + Math.random() * 12,
        thickness: 1 + Math.random() * 0.8,
        opacity: 0.125 + Math.random() * 0.175,
        drift: -0.5 - Math.random() * 0.5
      };
    }

    for (var i = 0; i < DROP_COUNT; i++) {
      var d = makeDrop();
      d.y = Math.random() * h;
      drops.push(d);
    }

    function makeSplash(x, y) {
      splashes.push({
        x: x, y: y,
        radius: 1,
        maxRadius: 3 + Math.random() * 5,
        opacity: 0.2,
        speed: 0.5 + Math.random() * 0.3
      });
    }

    function rainColor(opacity) {
      return isLight()
        ? 'rgba(100, 120, 150, ' + opacity + ')'
        : 'rgba(174, 200, 230, ' + opacity + ')';
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);

      for (var i = 0; i < drops.length; i++) {
        var d = drops[i];
        d.y += d.speed;
        d.x += d.drift;

        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x + d.drift * 2, d.y - d.len);
        ctx.strokeStyle = rainColor(d.opacity);
        ctx.lineWidth = d.thickness;
        ctx.lineCap = 'round';
        ctx.stroke();

        if (d.y > h) {
          if (Math.random() < 0.35) makeSplash(d.x, h - 2);
          drops[i] = makeDrop();
        }
      }

      for (var j = splashes.length - 1; j >= 0; j--) {
        var s = splashes[j];
        s.radius += s.speed;
        s.opacity -= 0.02;
        if (s.opacity <= 0 || s.radius > s.maxRadius) {
          splashes.splice(j, 1);
          continue;
        }
        ctx.beginPath();
        ctx.ellipse(s.x, s.y, s.radius * 2.5, s.radius * 0.6, 0, 0, Math.PI * 2);
        ctx.strokeStyle = rainColor(s.opacity);
        ctx.lineWidth = 0.6;
        ctx.stroke();
      }

      requestAnimationFrame(draw);
    }

    draw();
  }


  // --- Snow Animation ---
  function createSnow() {
    var canvas = document.createElement('canvas');
    canvas.id = 'snow-canvas';
    document.body.appendChild(canvas);

    var ctx = canvas.getContext('2d');
    var flakes = [];
    var FLAKE_COUNT = 150;
    var w, h;

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w;
      canvas.height = h;
    }
    resize();
    window.addEventListener('resize', resize);

    function makeFlake() {
      var radius = 1 + Math.random() * 3;
      return {
        x: Math.random() * w,
        y: -10 - Math.random() * h * 0.3,
        radius: radius,
        speed: 0.5 + radius * 0.4 + Math.random() * 0.5,
        opacity: 0.15 + Math.random() * 0.25,
        drift: (Math.random() - 0.5) * 0.6,
        wobbleSpeed: 0.01 + Math.random() * 0.02,
        wobbleAmp: 0.3 + Math.random() * 0.7,
        phase: Math.random() * Math.PI * 2
      };
    }

    for (var i = 0; i < FLAKE_COUNT; i++) {
      var f = makeFlake();
      f.y = Math.random() * h;
      flakes.push(f);
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);

      for (var i = 0; i < flakes.length; i++) {
        var f = flakes[i];
        f.phase += f.wobbleSpeed;
        f.y += f.speed;
        f.x += f.drift + Math.sin(f.phase) * f.wobbleAmp;

        ctx.beginPath();
        ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(230, 235, 245, ' + f.opacity + ')';
        ctx.fill();

        if (f.y > h + 10) {
          flakes[i] = makeFlake();
        }
      }

      requestAnimationFrame(draw);
    }

    draw();
  }


  // --- Cloud Animation ---
  function createClouds() {
    var canvas = document.createElement('canvas');
    canvas.id = 'cloud-canvas';
    document.body.appendChild(canvas);

    var ctx = canvas.getContext('2d');
    var clouds = [];
    var CLOUD_COUNT = 6;
    var w, h;

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w;
      canvas.height = h;
    }
    resize();
    window.addEventListener('resize', resize);

    function makeCloud(startOffscreen) {
      var scale = 0.6 + Math.random() * 0.8;
      var baseY = h * 0.08 + Math.random() * h * 0.45;
      var cloudW = (180 + Math.random() * 160) * scale;
      var cloudH = (70 + Math.random() * 50) * scale;
      var blobs = [];

      var baseBlobs = 6 + Math.floor(Math.random() * 4);
      for (var i = 0; i < baseBlobs; i++) {
        var t = i / (baseBlobs - 1);
        blobs.push({
          ox: (t - 0.5) * cloudW,
          oy: cloudH * 0.15 + (Math.random() - 0.5) * 6 * scale,
          r: (22 + Math.random() * 16) * scale
        });
      }

      var midBlobs = 8 + Math.floor(Math.random() * 5);
      for (var i = 0; i < midBlobs; i++) {
        var t = i / (midBlobs - 1);
        var spread = 0.85 - Math.abs(t - 0.5) * 0.4;
        blobs.push({
          ox: (t - 0.5) * cloudW * spread + (Math.random() - 0.5) * 20 * scale,
          oy: -(Math.random() * cloudH * 0.3) + (Math.random() - 0.5) * 10 * scale,
          r: (28 + Math.random() * 22) * scale
        });
      }

      var topBlobs = 5 + Math.floor(Math.random() * 4);
      for (var i = 0; i < topBlobs; i++) {
        var t = i / (topBlobs - 1);
        blobs.push({
          ox: (t - 0.5) * cloudW * 0.55 + (Math.random() - 0.5) * 15 * scale,
          oy: -cloudH * (0.35 + Math.random() * 0.35) + (Math.random() - 0.5) * 8 * scale,
          r: (20 + Math.random() * 20) * scale * (0.6 - Math.abs(t - 0.5) * 0.6) + 12 * scale
        });
      }

      var peakBlobs = 2 + Math.floor(Math.random() * 3);
      for (var i = 0; i < peakBlobs; i++) {
        blobs.push({
          ox: (Math.random() - 0.5) * cloudW * 0.3,
          oy: -cloudH * (0.7 + Math.random() * 0.25),
          r: (12 + Math.random() * 14) * scale
        });
      }

      return {
        x: startOffscreen ? w + cloudW : Math.random() * w,
        y: baseY,
        speed: 0.02 + Math.random() * 0.03,
        scale: scale,
        opacity: 0.035 + Math.random() * 0.03,
        width: cloudW,
        blobs: blobs
      };
    }

    for (var i = 0; i < CLOUD_COUNT; i++) {
      clouds.push(makeCloud(false));
    }

    function drawBlob(x, y, r, cloudOpacity) {
      var grad = ctx.createRadialGradient(x, y, 0, x, y, r);
      if (isLight()) {
        grad.addColorStop(0, 'rgba(120, 130, 150, ' + cloudOpacity * 1.5 + ')');
        grad.addColorStop(0.4, 'rgba(120, 130, 150, ' + cloudOpacity + ')');
        grad.addColorStop(0.7, 'rgba(110, 120, 140, ' + cloudOpacity * 0.5 + ')');
        grad.addColorStop(1, 'rgba(100, 110, 130, 0)');
      } else {
        grad.addColorStop(0, 'rgba(195, 205, 220, ' + cloudOpacity * 1.5 + ')');
        grad.addColorStop(0.4, 'rgba(195, 205, 220, ' + cloudOpacity + ')');
        grad.addColorStop(0.7, 'rgba(180, 190, 210, ' + cloudOpacity * 0.5 + ')');
        grad.addColorStop(1, 'rgba(170, 180, 200, 0)');
      }
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);

      for (var i = 0; i < clouds.length; i++) {
        var c = clouds[i];
        c.x += c.speed;

        for (var j = 0; j < c.blobs.length; j++) {
          var b = c.blobs[j];
          drawBlob(c.x + b.ox, c.y + b.oy, b.r, c.opacity);
        }

        if (c.x - c.width > w) {
          clouds[i] = makeCloud(true);
          clouds[i].x = -clouds[i].width;
        }
      }

      requestAnimationFrame(draw);
    }

    draw();
  }


  // --- Sunny Animation ---
  function createSunny() {
    var canvas = document.createElement('canvas');
    canvas.id = 'sunny-canvas';
    document.body.appendChild(canvas);

    var ctx = canvas.getContext('2d');
    var motes = [];
    var MOTE_COUNT = 40;
    var w, h;
    var glowPhase = 0;

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w;
      canvas.height = h;
    }
    resize();
    window.addEventListener('resize', resize);

    function makeMote() {
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        radius: 1 + Math.random() * 2,
        opacity: 0,
        maxOpacity: 0.08 + Math.random() * 0.12,
        fadeSpeed: 0.002 + Math.random() * 0.003,
        driftX: (Math.random() - 0.5) * 0.15,
        driftY: -0.05 - Math.random() * 0.1,
        phase: Math.random() * Math.PI * 2,
        wobble: 0.005 + Math.random() * 0.01,
        fadingIn: true
      };
    }

    for (var i = 0; i < MOTE_COUNT; i++) {
      var m = makeMote();
      m.opacity = Math.random() * m.maxOpacity;
      motes.push(m);
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      glowPhase += 0.003;
      var light = isLight();

      var glowOpacity = 0.03 + Math.sin(glowPhase) * 0.008;
      var gx = w * 0.85;
      var gy = h * 0.05;
      var gr = Math.max(w, h) * 0.7;
      var glow = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr);
      if (light) {
        glow.addColorStop(0, 'rgba(255, 190, 80, ' + glowOpacity * 2 + ')');
        glow.addColorStop(0.15, 'rgba(255, 175, 60, ' + glowOpacity * 1.2 + ')');
        glow.addColorStop(0.4, 'rgba(245, 160, 50, ' + glowOpacity * 0.5 + ')');
        glow.addColorStop(1, 'rgba(240, 150, 40, 0)');
      } else {
        glow.addColorStop(0, 'rgba(255, 210, 140, ' + glowOpacity * 2.5 + ')');
        glow.addColorStop(0.15, 'rgba(255, 195, 120, ' + glowOpacity * 1.5 + ')');
        glow.addColorStop(0.4, 'rgba(255, 180, 100, ' + glowOpacity * 0.6 + ')');
        glow.addColorStop(1, 'rgba(255, 170, 80, 0)');
      }
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      ctx.save();
      ctx.globalAlpha = 0.012 + Math.sin(glowPhase * 0.7) * 0.004;
      ctx.translate(gx, gy);
      ctx.rotate(0.6);
      for (var r = 0; r < 5; r++) {
        var rayW = 2 + r * 0.5;
        var rayLen = gr * (0.6 + r * 0.1);
        var rayX = (r - 2) * 80;
        var rayGrad = ctx.createLinearGradient(rayX, 0, rayX, rayLen);
        if (light) {
          rayGrad.addColorStop(0, 'rgba(220, 170, 60, 1)');
          rayGrad.addColorStop(0.5, 'rgba(220, 160, 50, 0.5)');
          rayGrad.addColorStop(1, 'rgba(210, 150, 40, 0)');
        } else {
          rayGrad.addColorStop(0, 'rgba(255, 220, 160, 1)');
          rayGrad.addColorStop(0.5, 'rgba(255, 210, 140, 0.5)');
          rayGrad.addColorStop(1, 'rgba(255, 200, 120, 0)');
        }
        ctx.fillStyle = rayGrad;
        ctx.fillRect(rayX - rayW, 0, rayW * 2, rayLen);
      }
      ctx.restore();

      for (var i = 0; i < motes.length; i++) {
        var m = motes[i];
        m.phase += m.wobble;
        m.x += m.driftX + Math.sin(m.phase) * 0.12;
        m.y += m.driftY;

        if (m.fadingIn) {
          m.opacity += m.fadeSpeed;
          if (m.opacity >= m.maxOpacity) {
            m.opacity = m.maxOpacity;
            m.fadingIn = false;
          }
        } else {
          m.opacity -= m.fadeSpeed;
          if (m.opacity <= 0) {
            motes[i] = makeMote();
            continue;
          }
        }

        var mg = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.radius * 3);
        if (light) {
          mg.addColorStop(0, 'rgba(200, 160, 60, ' + m.opacity + ')');
          mg.addColorStop(0.5, 'rgba(190, 150, 50, ' + m.opacity * 0.4 + ')');
          mg.addColorStop(1, 'rgba(180, 140, 40, 0)');
        } else {
          mg.addColorStop(0, 'rgba(255, 225, 160, ' + m.opacity + ')');
          mg.addColorStop(0.5, 'rgba(255, 215, 140, ' + m.opacity * 0.4 + ')');
          mg.addColorStop(1, 'rgba(255, 200, 120, 0)');
        }
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.radius * 3, 0, Math.PI * 2);
        ctx.fillStyle = mg;
        ctx.fill();
      }

      requestAnimationFrame(draw);
    }

    draw();
  }


  // --- Starry Sky Animation ---
  function createStarrySky() {
    var canvas = document.createElement('canvas');
    canvas.id = 'star-canvas';
    document.body.appendChild(canvas);

    var ctx = canvas.getContext('2d');
    var w, h;

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w;
      canvas.height = h;
    }
    resize();
    window.addEventListener('resize', resize);

    // Squamish coordinates
    var LAT = 49.7016;
    var LON = -123.1558;
    var LAT_RAD = LAT * Math.PI / 180;

    // ~100 brightest stars (mag < 3.0, dec > -40°)
    // Format: [name, RA hours, Dec degrees, magnitude]
    var STARS = [
      ['Sirius', 6.752, -16.72, -1.46],
      ['Arcturus', 14.261, 19.18, -0.05],
      ['Vega', 18.616, 38.78, 0.03],
      ['Capella', 5.278, 46.00, 0.08],
      ['Rigel', 5.242, -8.20, 0.13],
      ['Procyon', 7.655, 5.22, 0.34],
      ['Betelgeuse', 5.919, 7.41, 0.42],
      ['Altair', 19.846, 8.87, 0.76],
      ['Aldebaran', 4.599, 16.51, 0.86],
      ['Spica', 13.420, -11.16, 0.97],
      ['Antares', 16.490, -26.43, 1.04],
      ['Pollux', 7.755, 28.03, 1.14],
      ['Fomalhaut', 22.961, -29.62, 1.16],
      ['Deneb', 20.690, 45.28, 1.25],
      ['Regulus', 10.140, 11.97, 1.35],
      ['Castor', 7.577, 31.89, 1.58],
      ['Bellatrix', 5.419, 6.35, 1.64],
      ['Elnath', 5.438, 28.61, 1.65],
      ['Alnilam', 5.603, -1.20, 1.69],
      ['Alioth', 12.900, 55.96, 1.77],
      ['Dubhe', 11.062, 61.75, 1.79],
      ['Mirfak', 3.405, 49.86, 1.79],
      ['Kaus Australis', 18.403, -34.38, 1.85],
      ['Alkaid', 13.792, 49.31, 1.86],
      ['Alhena', 6.629, 16.40, 1.93],
      ['Alnitak', 5.679, -1.94, 1.95],
      ['Mizar', 13.399, 54.93, 2.04],
      ['Saiph', 5.796, -9.67, 2.09],
      ['Polaris', 2.530, 89.26, 2.02],
      ['Algol', 3.137, 40.96, 2.12],
      ['Denebola', 11.818, 14.57, 2.13],
      ['Mintaka', 5.533, -0.30, 2.23],
      ['Alpheratz', 0.140, 29.09, 2.06],
      ['Merak', 11.031, 56.38, 2.37],
      ['Phecda', 11.897, 53.69, 2.44],
      ['Megrez', 12.257, 57.03, 3.31],
      ['Schedar', 0.675, 56.54, 2.23],
      ['Caph', 0.153, 59.15, 2.27],
      ['Diphda', 0.727, -17.99, 2.02],
      ['Hamal', 2.120, 23.46, 2.00],
      ['Acamar', 2.971, -40.30, 2.88],
      ['Menkar', 3.038, 4.09, 2.53],
      ['Mira', 2.323, -2.98, 2.00],
      ['Alcyone', 3.791, 24.11, 2.87],
      ['Wezen', 7.140, -26.39, 1.84],
      ['Adhara', 6.977, -28.97, 1.50],
      ['Naos', 8.060, -40.00, 2.25],
      ['Alphard', 9.460, -8.66, 1.98],
      ['Cor Caroli', 12.934, 38.32, 2.90],
      ['Gienah', 12.263, -17.54, 2.59],
      ['Algorab', 12.497, -16.52, 2.95],
      ['Kraz', 12.573, -23.40, 2.65],
      ['Zubeneschamali', 15.283, -9.38, 2.61],
      ['Unukalhai', 15.738, 6.43, 2.65],
      ['Rasalgethi', 17.244, 14.39, 2.81],
      ['Rasalhague', 17.582, 12.56, 2.08],
      ['Shaula', 17.560, -37.10, 1.63],
      ['Nunki', 18.921, -26.30, 2.02],
      ['Sheliak', 18.835, 33.36, 3.45],
      ['Sulafat', 18.982, 32.69, 3.24],
      ['Albireo', 19.512, 27.96, 3.08],
      ['Sadr', 20.370, 40.26, 2.23],
      ['Enif', 21.736, 9.88, 2.39],
      ['Markab', 23.079, 15.21, 2.49],
      ['Scheat', 23.063, 28.08, 2.42],
      ['Algenib', 0.220, 15.18, 2.83],
      ['Mirach', 1.163, 35.62, 2.05],
      ['Almach', 2.065, 42.33, 2.17],
      ['Tsih', 0.945, 60.72, 2.47],
      ['Ruchbah', 1.430, 60.24, 2.68],
      ['Pherkad', 15.346, 71.83, 3.00],
      ['Kochab', 14.845, 74.16, 2.08],
      ['Thuban', 14.073, 64.38, 3.65],
      ['Eltanin', 17.943, 51.49, 2.23],
      ['Rastaban', 17.507, 52.30, 2.79],
      ['Alderamin', 21.310, 62.59, 2.51],
      ['Errai', 23.655, 77.63, 3.21],
      ['Izar', 14.750, 27.07, 2.37],
      ['Nekkar', 15.032, 40.39, 3.58],
      ['Alphecca', 15.578, 26.71, 2.23],
      ['Gemma', 15.578, 26.71, 2.22],
      ['Kornephoros', 16.504, 21.49, 2.77],
      ['Atria', 16.811, -69.03, 1.92],
      ['Sabik', 17.173, -15.72, 2.43],
      ['Nunki', 18.921, -26.30, 2.05],
      ['Ascella', 19.043, -29.88, 2.60],
      ['Dabih', 20.350, -14.78, 3.08],
      ['Nashira', 21.668, -16.66, 3.69],
      ['Sadalsuud', 21.526, -5.57, 2.91],
      ['Sadalmelik', 22.096, -0.32, 2.96],
      ['Skat', 22.691, -15.82, 3.27],
    ];

    // 5 visible planets with simplified positions
    // We'll compute approximate ecliptic longitude from orbital elements
    var PLANETS = [
      { name: 'Mercury', color: [180, 180, 170], size: 1.5, period: 87.969, lon0: 174.8, epoch: 2451545.0 },
      { name: 'Venus', color: [255, 248, 220], size: 2.5, period: 224.701, lon0: 50.4, epoch: 2451545.0 },
      { name: 'Mars', color: [255, 140, 100], size: 2.0, period: 686.971, lon0: 19.4, epoch: 2451545.0 },
      { name: 'Jupiter', color: [255, 220, 180], size: 3.0, period: 4332.59, lon0: 34.4, epoch: 2451545.0 },
      { name: 'Saturn', color: [255, 230, 180], size: 2.5, period: 10759.22, lon0: 49.9, epoch: 2451545.0 }
    ];

    // Astronomical calculations
    function julianDate(date) {
      var y = date.getUTCFullYear();
      var m = date.getUTCMonth() + 1;
      var d = date.getUTCDate() + date.getUTCHours() / 24 + date.getUTCMinutes() / 1440 + date.getUTCSeconds() / 86400;
      if (m <= 2) { y--; m += 12; }
      var A = Math.floor(y / 100);
      var B = 2 - A + Math.floor(A / 4);
      return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5;
    }

    function gmst(jd) {
      var T = (jd - 2451545.0) / 36525.0;
      var gmst = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * T * T;
      return ((gmst % 360) + 360) % 360;
    }

    function raDecToAltAz(ra, dec, lst) {
      var raRad = ra * 15 * Math.PI / 180;
      var decRad = dec * Math.PI / 180;
      var lstRad = lst * Math.PI / 180;
      var ha = lstRad - raRad;

      var sinAlt = Math.sin(decRad) * Math.sin(LAT_RAD) + Math.cos(decRad) * Math.cos(LAT_RAD) * Math.cos(ha);
      var alt = Math.asin(sinAlt);

      var cosAz = (Math.sin(decRad) - Math.sin(alt) * Math.sin(LAT_RAD)) / (Math.cos(alt) * Math.cos(LAT_RAD));
      cosAz = Math.max(-1, Math.min(1, cosAz));
      var az = Math.acos(cosAz);
      if (Math.sin(ha) > 0) az = 2 * Math.PI - az;

      return { alt: alt * 180 / Math.PI, az: az * 180 / Math.PI };
    }

    function altAzToXY(alt, az) {
      if (alt < 0) return null;
      // Map hemisphere to screen: zenith at center-top, horizon at bottom
      var r = (1 - alt / 90);
      var azRad = az * Math.PI / 180;
      var x = w * 0.5 + r * w * 0.45 * Math.sin(azRad);
      var y = h * 0.1 + r * h * 0.85 * Math.cos(azRad);
      return { x: x, y: y };
    }

    function magToRadius(mag) {
      // Brighter stars (lower mag) get larger radius
      return Math.max(0.5, 2.5 - mag * 0.5);
    }

    // Planet ecliptic longitude (very simplified)
    function planetRA(planet, jd) {
      var daysSinceEpoch = jd - planet.epoch;
      var meanLon = planet.lon0 + (360 / planet.period) * daysSinceEpoch;
      meanLon = ((meanLon % 360) + 360) % 360;
      // Approximate: ecliptic longitude ~ RA for planets near ecliptic
      return meanLon / 15; // convert degrees to hours
    }

    var starPositions = [];
    var planetPositions = [];
    var twinklePhases = [];

    for (var i = 0; i < STARS.length; i++) {
      twinklePhases.push(Math.random() * Math.PI * 2);
    }

    function calculatePositions() {
      var now = new Date();
      var jd = julianDate(now);
      var gmstDeg = gmst(jd);
      var lst = gmstDeg + LON;

      starPositions = [];
      for (var i = 0; i < STARS.length; i++) {
        var s = STARS[i];
        var pos = raDecToAltAz(s[1], s[2], lst);
        if (pos.alt > 0) {
          var xy = altAzToXY(pos.alt, pos.az);
          if (xy) {
            starPositions.push({
              x: xy.x, y: xy.y,
              radius: magToRadius(s[3]),
              mag: s[3],
              idx: i
            });
          }
        }
      }

      planetPositions = [];
      for (var i = 0; i < PLANETS.length; i++) {
        var p = PLANETS[i];
        var ra = planetRA(p, jd);
        // Planets are roughly on ecliptic, approximate dec as small
        var dec = 0 + Math.sin(ra * 0.3) * 5; // rough ecliptic tilt approximation
        var pos = raDecToAltAz(ra, dec, lst);
        if (pos.alt > 5) { // Only show when well above horizon
          var xy = altAzToXY(pos.alt, pos.az);
          if (xy) {
            planetPositions.push({
              x: xy.x, y: xy.y,
              size: p.size,
              color: p.color,
              name: p.name
            });
          }
        }
      }
    }

    calculatePositions();
    setInterval(calculatePositions, 60000);

    var frameCount = 0;

    function draw() {
      ctx.clearRect(0, 0, w, h);
      frameCount++;

      // Draw stars
      for (var i = 0; i < starPositions.length; i++) {
        var s = starPositions[i];
        twinklePhases[s.idx] += 0.02 + Math.random() * 0.01;
        var twinkle = 0.6 + 0.4 * Math.sin(twinklePhases[s.idx]);
        var opacity = twinkle * Math.min(1, (3.5 - s.mag) / 4);

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(220, 230, 255, ' + opacity + ')';
        ctx.fill();

        // Add glow for bright stars
        if (s.mag < 1.5) {
          var glow = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.radius * 4);
          glow.addColorStop(0, 'rgba(200, 215, 255, ' + opacity * 0.3 + ')');
          glow.addColorStop(1, 'rgba(200, 215, 255, 0)');
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.radius * 4, 0, Math.PI * 2);
          ctx.fillStyle = glow;
          ctx.fill();
        }
      }

      // Draw planets
      for (var i = 0; i < planetPositions.length; i++) {
        var p = planetPositions[i];
        var c = p.color;

        // Planets don't twinkle — steady glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + c[0] + ', ' + c[1] + ', ' + c[2] + ', 0.9)';
        ctx.fill();

        // Planet glow
        var glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 5);
        glow.addColorStop(0, 'rgba(' + c[0] + ', ' + c[1] + ', ' + c[2] + ', 0.2)');
        glow.addColorStop(1, 'rgba(' + c[0] + ', ' + c[1] + ', ' + c[2] + ', 0)');
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 5, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();
      }

      requestAnimationFrame(draw);
    }

    draw();
  }

})();
