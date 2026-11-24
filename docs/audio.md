# Sound

Every cue in Boots on the Ground is synthesized in the browser with the Web Audio API. There are no sampled recordings and no third-party tracks.

The march is an original walking cadence: a low pulse, a snare-like noise, and a short triangle motif written for this game. It is not a copyrighted bugle call. The round-start sting uses the same harmonic series and is also original.

Effects, by role:

| Cue | When |
|---|---|
| Rifle | Trooper |
| Sniper | Longshot |
| Gatling | Gatling gunner |
| Mauler | Mauler minigun |
| Flame | Flamethrower |
| Mortar | Mortar launch |
| Cannon | Tread tank |
| Flak | Sky Guard |
| Chopper | Chopper pad |
| Wrench | Engineer, placed or paid |
| Tent | Supply tent, placed |
| Boom | Shells, flak, and blasts when they land |
| Down | An enemy falls |
| Boss | A boss arrives, and again when it falls |
| Wave / Clear | Round start and round end |
| March | Loops while music is on |

Mute, music, effects, and volume are saved in `localStorage` under `botg-muted`, `botg-music`, `botg-sfx`, and `botg-volume`. Volume cycles 40%, 70%, and 100% and scales every voice, including the march.
