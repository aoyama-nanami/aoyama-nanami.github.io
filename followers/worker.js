function CombineParty(p, followers, required_ilv, max_ilv, missions) {
    var o = {}

    p.forEach(function(x, i) {
        var target_ilv = required_ilv + Math.ceil((missions[i].score - x.score) / 3)
        target_ilv = Math.min(target_ilv, max_ilv)
        x.party.forEach(function(y) {
            o[y] = Math.max(o[y] || 0, target_ilv)
        })
    })

    var ilv_diff = 0
    Object.keys(o).forEach(function(x){
        ilv_diff += Math.max(o[x] - followers[x].iLevel, 0)
    
    })

    return [o, ilv_diff]
}



function MasterPlan(mission, followers, garrison_abilities, garrison_followers) {
    var result = []

    for (var i = 0; i < followers.length; i++) {
        for (var j = i + 1; j < followers.length; j++) {
            for (var k = j + 1; k < followers.length; k++) {
                var score = MissionSuccessRate(
                    mission,
                    [followers[i], followers[j], followers[k]],
                    mission.score,
                    garrison_abilities,
                    garrison_followers
                )
                result.push({"score": score, "party": [i, j, k]})
            }
        }
    }

    result.sort(function(x, y) { return y.score - x.score })
    if (result.length > 0) {
        var best_score = result[0].score
        result = result.filter(function(r) { return r.score >= best_score - 30 })
    }

    return result
}

function MissionSuccessRate(mission, followers, mission_score, garrison_abilities, garrison_followers) {
    var my_score = 30 * followers.length
    var mission_type_countered = false
    var racial_bonus = 0
    var counter_bonus = 0

    var traits = {}
    var epic_mount = 0
    var high_stamina = 0
    var burst_of_power = 0
    var combat_experience = 0
    var dancer = 0

    var ability_map = {}
    mission.ability.forEach(function(ability) {
        ability_map[ability] = (ability_map[ability] || 0) + 1
    });

    followers.forEach(function(follower) {
        var is_dancer = false
        follower.ability.forEach(function(ability) {
            var detail = garrison_abilities[ability.id]
            if (detail.trait) {
                traits[ability.id] = traits[ability.id] || 0
                traits[ability.id] += 1

                if (ability.id == 232) {  // dancer
                    is_dancer = true
                } else if (detail.category == 1 || detail.category == 6) {
                    // slayer / environment preference
                    if (detail.counters.indexOf(mission.type) >= 0) {
                        mission_type_countered = true;
                    }
                } else if (detail.category == 4) {  // racial preference
                    if (MatchRace(detail.race, followers, follower.garrFollowerID, garrison_followers)) {
                        racial_bonus += 1
                    }
                }
            } else {
                detail.counters.forEach(function(counter) {
                    var a = ability_map[counter]
                    if (a) {
                        ability_map[counter] -= 1
                        counter_bonus += 1
                    }
                })
            }
        })

        /*
        if (is_dancer && follower.ability.indexOf(6) >= 0) {
            dancer += 1
        }
        */
    })

    var time = 8 / Math.pow(2, (traits[221] || 0))
    if (time >= 7) {  // high_stamina
        my_score += (traits[76] || 0) * 30
    } else {  // Burst
        my_score += (traits[77] || 0) * 30
    }
    my_score += (traits[201] || 0) * 30

    if (mission_type_countered) my_score += 30
    my_score += racial_bonus * 45
    my_score += counter_bonus * 90
    my_score += dancer * 45

    if (my_score > mission_score) my_score = mission_score

    return my_score
}

function MatchRace(race, followers, my_id, garrison_followers) {
    return followers.some(function(follower) {
        if (follower.garrFollowerID == my_id) return false
        return race.indexOf(garrison_followers[follower.garrFollowerID].horde.race) >= 0
    })
}

onmessage = function(e) {
    var missions = e.data.missions
    var followers = e.data.followers
    var required_ilv = e.data.required_ilv
    var max_ilv = e.data.max_ilv
    var garrison_abilities = e.data.garrison_abilities
    var garrison_followers = e.data.garrison_followers

    var candidates = missions.map(function(c){
        return MasterPlan(c, followers, garrison_abilities, garrison_followers)
    })
    var indexes = new Int32Array(missions.length)
    var best_list = []
    var best = 9999999

    function NextPermutation(a, c) {
        for (var i = 0; i < a.length; i++) {
            a[i]++
            if (a[i] == c[i].length) {
                a[i] = 0
            } else {
                return true
            }
        }
        return false
    }

    do {
        var rows = []
        for (var i = 0; i < indexes.length; i++) {
            rows.push(candidates[i][indexes[i]])
        }
        var result = CombineParty(rows, followers, required_ilv, max_ilv, missions)
        var party = result[0]
        var score = result[1]
        if (score < best) {
            best = score
            best_list = []
        }
        if (score <= best) {
            best_list.push({"party": party, "rows": rows})
        }
    } while (NextPermutation(indexes, candidates))

    postMessage({"best_score": best, "best_list": best_list})
}
