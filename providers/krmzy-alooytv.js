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