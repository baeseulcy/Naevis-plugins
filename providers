/*
 * Nuvio provider: Krmzy + AlooyTV
 * Supports Turkish/Arabic TV series.
 *
 * Built for Nuvio's single-file provider format.
 * Uses Promise chains for Hermes compatibility.
 */

var TMDB_API_KEY = '1c29a5198ee1854bd5eb45dbe8d17d92';

var SITES = [
  {
    id: 'krmzy',
    name: 'قرمزي',
    base: 'https://krmzy.org',
    languages: ['ar', 'tr']
  },
  {
    id: 'alooytv',
    name: 'AlooyTV',
    base: 'https://alooytv14.xyz',
    languages: ['ar', 'tr']
  }
];

var UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/147.0.0.0 Safari/537.36';

function headers(referer) {
  return {
    'User-Agent': UA,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'ar,en;q=0.9,tr;q=0.8',
    'Referer': referer || 'https://www.google.com/'
  };
}

function absolute(base, url) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  if (url.indexOf('//') === 0) return 'https:' + url;
  if (url.charAt(0) === '/') return base + url;
  return base + '/' + url;
}

function cleanText(s) {
  return (s || '').replace(/\s+/g, ' ').trim();
}

function normalize(s) {
  return cleanText(s).toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/ي/g, 'ي')
    .replace(/[^a-z0-9\u0600-\u06ff]+/g, '');
}

function words(s) {
  return cleanText(s).toLowerCase()
    .replace(/[^\w\u0600-\u06ff]+/g, ' ')
    .split(/\s+/)
    .filter(function(x) { return x.length > 1; });
}

function scoreMatch(text, query, year) {
  var a = normalize(text);
  var b = normalize(query);
  var score = 0;

  if (a === b) score += 100;
  if (b && a.indexOf(b) !== -1) score += 60;

  var ws = words(query);
  ws.forEach(function(w) {
    if (normalize(text).indexOf(normalize(w)) !== -1) score += 8;
  });

  if (year && text.indexOf(year) !== -1) score += 20;
  return score;
}

function tmdbInfo(tmdbId, mediaType) {
  var endpoint = mediaType === 'movie' ? 'movie' : 'tv';
  var url = 'https://api.themoviedb.org/3/' + endpoint + '/' + encodeURIComponent(tmdbId)
    + '?api_key=' + TMDB_API_KEY + '&language=ar';

  return fetch(url, { headers: headers() })
    .then(function(r) {
      if (!r.ok) throw new Error('TMDB ' + r.status);
      return r.json();
    })
    .then(function(d) {
      var original = d.original_name || d.original_title || '';
      var arabic = d.name || d.title || '';
      var year = '';

      if (d.first_air_date) year = d.first_air_date.slice(0, 4);
      else if (d.release_date) year = d.release_date.slice(0, 4);

      return {
        arabic: arabic,
        original: original,
        year: year
      };
    });
}

/* Generic JS eval-pack decoder used by several public video pages. */
function unpackEval(html) {
  var m = html && html.match(
    /eval\s*\(\s*function\s*\(.*?\)\s*\{[\s\S]*?\}\s*\(([\s\S]*?)\)\s*\)/
  );
  if (!m) return html || '';

  var args = m[1].match(
    /['"]([\s\S]*?)['"]\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*['"]([\s\S]*?)['"]\.split\(['"]\|['"]\)/
  );
  if (!args) return html;

  var packed = args[1];
  var base = parseInt(args[2], 10);
  var count = parseInt(args[3], 10);
  var dict = args[4].split('|');

  function toBase(n, radix) {
    var chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (n === 0) return '0';
    var out = '';
    while (n > 0) {
      out = chars.charAt(n % radix) + out;
      n = Math.floor(n / radix);
    }
    return out;
  }

  var map = {};
  for (var i = 0; i < count; i++) {
    if (dict[i]) map[toBase(i, base)] = dict[i];
  }

  return packed.replace(/\b\w+\b/g, function(token) {
    return Object.prototype.hasOwnProperty.call(map, token) ? map[token] : token;
  });
}

function extractMediaUrls(html) {
  var out = [];
  var text = unpackEval(html || '');

  function add(url, quality) {
    if (!url) return;
    url = url.replace(/\\\//g, '/').replace(/&amp;/g, '&');
    if (!/^https?:\/\//i.test(url)) return;
    if (!/\.(m3u8|mp4|mkv)(?:[?#]|$)/i.test(url)) return;

    var key = url;
    for (var i = 0; i < out.length; i++) {
      if (out[i].url === key) return;
    }
    out.push({ url: url, quality: quality || guessQuality(url) });
  }

  var patterns = [
    /["']file["']\s*:\s*["']([^"']+)["']/gi,
    /["']file["']\s*=\s*["']([^"']+)["']/gi,
    /["']src["']\s*:\s*["']([^"']+)["']/gi,
    /["']source["']\s*:\s*["']([^"']+)["']/gi,
    /(https?:\/\/[^"'\\\s<>]+\.m3u8(?:\?[^"'\\\s<>]*)?)/gi,
    /(https?:\/\/[^"'\\\s<>]+\.mp4(?:\?[^"'\\\s<>]*)?)/gi
  ];

  patterns.forEach(function(re) {
    var m;
    while ((m = re.exec(text)) !== null) add(m[1]);
  });

  return out;
}

function guessQuality(url) {
  var m = String(url).match(/(?:^|[^0-9])(2160|1440|1080|720|576|480|360)p?(?:[^0-9]|$)/i);
  return m ? m[1] + 'p' : 'HD';
}

function findIframes(html, base) {
  var urls = [];
  var re = /<iframe[^>]+(?:src|data-src)\s*=\s*["']([^"']+)["']/gi;
  var m;
  while ((m = re.exec(html || '')) !== null) {
    var u = absolute(base, m[1]);
    if (u && urls.indexOf(u) === -1) urls.push(u);
  }

  /* Also catch common player links/buttons. */
  var re2 = /(?:href|data-src|data-url)\s*=\s*["']([^"']*(?:embed|player|m3u8|stream)[^"']*)["']/gi;
  while ((m = re2.exec(html || '')) !== null) {
    var u2 = absolute(base, m[1]);
    if (u2 && urls.indexOf(u2) === -1) urls.push(u2);
  }
  return urls;
}

function searchSite(site, query, year) {
  var url = site.base + '/?s=' + encodeURIComponent(query);

  return fetch(url, { headers: headers(site.base + '/') })
    .then(function(r) {
      if (!r.ok) throw new Error(site.name + ' search ' + r.status);
      return r.text();
    })
    .then(function(html) {
      var $ = require('cheerio-without-node-native').load(html);
      var candidates = [];

      $('a').each(function() {
        var href = $(this).attr('href') || '';
        var text = cleanText($(this).text() || $(this).attr('title') || '');
        if (!href || !text) return;

        var full = absolute(site.base, href);
        if (!full) return;

        /* Keep likely series/content pages and discard navigation/social links. */
        if (full.indexOf(site.base) !== 0) return;
        if (/(privacy|contact|instagram|tiktok|facebook|twitter|x\.com)/i.test(full)) return;

        var sc = scoreMatch(text, query, year);
        if (sc > 0) candidates.push({ url: full, text: text, score: sc });
      });

      candidates.sort(function(a, b) { return b.score - a.score; });

      var unique = [];
      candidates.forEach(function(c) {
        if (!unique.some(function(x) { return x.url === c.url; })) unique.push(c);
      });

      return unique.slice(0, 5);
    })
    .catch(function() { return []; });
}

function getEpisodeNumber(url) {
  var m = String(url).match(/(?:episode|ep|الحلقه|الحلقة)[^0-9]{0,20}(\d{1,4})/i);
  if (m) return parseInt(m[1], 10);

  var m2 = String(url).match(/(?:[-_\/])(\d{1,4})(?:\/)?(?:[?#]|$)/);
  return m2 ? parseInt(m2[1], 10) : null;
}

function collectEpisodes(site, seriesUrl) {
  return fetch(seriesUrl, { headers: headers(site.base + '/') })
    .then(function(r) {
      if (!r.ok) throw new Error('series ' + r.status);
      return r.text();
    })
    .then(function(html) {
      var $ = require('cheerio-without-node-native').load(html);
      var eps = [];

      $('a').each(function() {
        var href = $(this).attr('href') || '';
        var text = cleanText($(this).text() || $(this).attr('title') || '');
        if (!href) return;

        var full = absolute(site.base, href);
        if (!full || full.indexOf(site.base) !== 0) return;

        var n = getEpisodeNumber(full + ' ' + text);
        if (n === null) return;

        if (/episode|ep|الحلق|حلقة/i.test(full + ' ' + text)) {
          eps.push({ url: full, episode: n, title: text });
        }
      });

      var seen = {};
      eps = eps.filter(function(e) {
        if (seen[e.url]) return false;
        seen[e.url] = true;
        return true;
      });

      eps.sort(function(a, b) { return a.episode - b.episode; });
      return eps;
    })
    .catch(function() { return []; });
}

function extractFromEpisode(site, episodeUrl) {
  return fetch(episodeUrl, { headers: headers(site.base + '/') })
    .then(function(r) {
      if (!r.ok) throw new Error('episode ' + r.status);
      return r.text();
    })
    .then(function(html) {
      var direct = extractMediaUrls(html);
      if (direct.length) {
        return direct.map(function(x) {
          return {
            name: site.name,
            title: x.quality,
            url: x.url,
            quality: x.quality,
            type: x.url.indexOf('.m3u8') !== -1 ? 'hls' : 'mp4',
            headers: {
              'Referer': episodeUrl,
              'User-Agent': UA
            }
          };
        });
      }

      var frames = findIframes(html, site.base);
      if (!frames.length) return [];

      return frames.slice(0, 5).reduce(function(chain, frameUrl) {
        return chain.then(function(all) {
          return fetch(frameUrl, { headers: headers(episodeUrl) })
            .then(function(r) {
              if (!r.ok) return all;
              return r.text();
            })
            .then(function(frameHtml) {
              var media = extractMediaUrls(frameHtml);

              /*
               * AlooyTV currently wraps some players as:
               * /m3u8/?src=https://embed....../e/<id>
               * Follow the src target as well.
               */
              var srcMatch = frameUrl.match(/[?&]src=([^&]+)/i);
              if (srcMatch) {
                try {
                  var decoded = decodeURIComponent(srcMatch[1]);
                  if (decoded && decoded !== frameUrl) {
                    return fetch(decoded, { headers: headers(frameUrl) })
                      .then(function(rr) {
                        if (!rr.ok) return all.concat(media);
                        return rr.text();
                      })
                      .then(function(embedHtml) {
                        var media2 = extractMediaUrls(embedHtml);
                        return all.concat(media, media2);
                      })
                      .catch(function() { return all.concat(media); });
                  }
                } catch (_) {}
              }

              return all.concat(media);
            })
            .catch(function() { return all; });
        });
      }, Promise.resolve([]))
      .then(function(media) {
        var seen = {};
        return media.filter(function(x) {
          if (seen[x.url]) return false;
          seen[x.url] = true;
          return true;
        }).map(function(x) {
          return {
            name: site.name,
            title: x.quality,
            url: x.url,
            quality: x.quality,
            type: x.url.indexOf('.m3u8') !== -1 ? 'hls' : 'mp4',
            headers: {
              'Referer': episodeUrl,
              'User-Agent': UA
            }
          };
        });
      });
    })
    .catch(function() { return []; });
}

function providerForSite(site, info, seasonNum, episodeNum) {
  var queries = [];
  if (info.arabic) queries.push(info.arabic);
  if (info.original && queries.indexOf(info.original) === -1) queries.push(info.original);

  return queries.reduce(function(chain, q) {
    return chain.then(function(existing) {
      if (existing.length) return existing;

      return searchSite(site, q, info.year)
        .then(function(results) {
          if (!results.length) return [];

          var best = results[0];
          return collectEpisodes(site, best.url)
            .then(function(eps) {
              if (!eps.length) {
                /* Some sites put the episode links directly on the result page. */
                var n = episodeNum || 1;
                return extractFromEpisode(site, best.url)
                  .then(function(s) { return s; });
              }

              var wanted = eps.filter(function(e) {
                return e.episode === Number(episodeNum);
              });

              if (!wanted.length && episodeNum == null) wanted = eps.slice(0, 1);
              if (!wanted.length) return [];

              return wanted.reduce(function(p, e) {
                return p.then(function(out) {
                  return extractFromEpisode(site, e.url)
                    .then(function(s) { return out.concat(s); });
                });
              }, Promise.resolve([]));
            });
        });
    });
  }, Promise.resolve([]));
}

function getStreams(tmdbId, mediaType, seasonNum, episodeNum) {
  if (mediaType !== 'tv') return Promise.resolve([]);

  return tmdbInfo(tmdbId, mediaType)
    .then(function(info) {
      if (!info.arabic && !info.original) return [];

      return SITES.reduce(function(chain, site) {
        return chain.then(function(all) {
          return providerForSite(site, info, seasonNum, episodeNum)
            .then(function(streams) {
              return all.concat(streams || []);
            });
        });
      }, Promise.resolve([]));
    })
    .catch(function(err) {
      console.log('[Krmzy+AlooyTV] ' + (err && err.message ? err.message : err));
      return [];
    });
}

module.exports = { getStreams };
