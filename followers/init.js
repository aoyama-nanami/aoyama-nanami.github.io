var wowhead_tooltips = { "colorlinks": true, "iconizelinks": true, "renamelinks": true }

function CreateFollowerTooltip(follower) {
    var rel = "level=" + follower.level + "&q=" + follower.quality +
        "&abil=" + $.map(follower.ability, function(ability) { return ability.id }).join(":")
    
    var a = $("<a></a>")
        .attr("href", "http://www.wowhead.com/follower=" + follower.garrFollowerID + ".2")
        .attr("class", "q" + follower.quality)
        .attr("rel", rel)
    var img = $("<img/>")
        .attr("src", "http://wow.zamimg.com/images/wow/garr/" +
                g_garrison_followers[follower.garrFollowerID].horde.portrait + ".png")
        .attr("class", "followerPortrait")

    var span = $("<span></span>")

    return span.append(img).append(a)
}

function CreateFollowerPartyRow(party, required_score) {
    var tr = $("<tr>")
    tr.append("<td>" + (party.score * 100 / required_score).toFixed(2) + "%</td>")
        .append($("<td>").text(party.score))
        .append($("<td>").append(CreateFollowerTooltip(my_followers[party.party[0]])))
        .append($("<td>").append(CreateFollowerTooltip(my_followers[party.party[1]])))
        .append($("<td>").append(CreateFollowerTooltip(my_followers[party.party[2]])))
    return tr
}

$(document).ready(function() {
    var blackrock_missions = [
        {"slot": 3, "type": 18, "id": 454, "ability": [3, 6, 1, 2, 10, 7, 9]},
        {"slot": 3, "type": 21, "id": 455, "ability": [2, 6, 1, 3, 10, 8, 3]},
        {"slot": 3, "type": 24, "id": 456, "ability": [4, 3, 8, 4, 7, 7, 6]},
        {"slot": 3, "type": 11, "id": 457, "ability": [1, 10, 3, 6, 9, 8, 2]},
    ]

    var highmaul_missions = [
        {"slot": 3, "type": 28, "id": 321, "ability": [8, 6, 1, 9, 2, 10]},
        {"slot": 3, "type": 17, "id": 322, "ability": [3, 6, 4, 7, 1, 3]},
        {"slot": 3, "type": 12, "id": 323, "ability": [4, 7, 2, 10, 10, 9]},
        {"slot": 3, "type": 29, "id": 324, "ability": [8, 6, 1, 9, 10, 9]},
    ]

    // Compute(highmaul_missions, 645, 655)
    Compute(blackrock_missions, 660, 670)
})

function Compute(missions, required_ilv, max_ilv) {
    var start_time = new Date().getTime()

    var container = $("#result_container")
    container.empty()

    for (var i = 0; i < missions.length; i++) {
        var a = $("<a>").attr("href", "http://ptr.wowhead.com/mission=" + missions[i].id)
            .addClass("mission_link")
        var table = $("<table>")
        missions[i].element = table
        missions[i].score = 90 * missions[i].ability.length + 30 * missions[i].slot
        
        container.append([a, table, "<hr/>"])
    }

    var candidates = missions.map(MasterPlan)
    var indexes = missions.map(function(){ return 0 })
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
        var rows = indexes.map(function(x, i){ return candidates[i][x] })
        var result = CombineParty(rows, my_followers, required_ilv, max_ilv, missions)
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

    var output_tables = missions.map(function(m){ return m.element })

    best_list.forEach(function(p, i) {
        var tr = $("<tr>")
        Object.keys(p.party).forEach(function(x, j) {
            var td = $("<td>")
            td.append(CreateFollowerTooltip(my_followers[x]))
            td.append($("<span>").html("(" + my_followers[x].iLevel + " &#8594; " + p.party[x] + ")"))
            tr.append(td)
        })
        tr.append($("<td>").text("+" + best + " iLevel"))

        p.elements = []
        for (var j = 0; j < p.rows.length; j++) {
            if (typeof p.rows[j].element == "undefined") {
                p.rows[j].element = CreateFollowerPartyRow(p.rows[j], missions[i].score)
                $(output_tables[j]).append(p.rows[j].element)
            }
            p.elements.push(p.rows[j].element)
        }


        $(tr).hover(
            function(){ $.each(p.elements, function(i, e) { e.addClass("highlight") }) },
            function(){ $.each(p.elements, function(i, e) { e.removeClass("highlight") }) }
        )

        $("#minimal_party").append(tr)
    })

    $("#message").text("computation time: " + (new Date().getTime() - start_time) + "ms")
}

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
        ilv_diff += o[x] - followers[x].iLevel
    })

    return [o, ilv_diff]
}



function MasterPlan(mission) {
    var result = []

    for (var i = 0; i < my_followers.length; i++) {
        for (var j = i + 1; j < my_followers.length; j++) {
            for (var k = j + 1; k < my_followers.length; k++) {
                var score = MissionSuccessRate(
                    mission,
                    [my_followers[i], my_followers[j], my_followers[k]],
                    mission.score
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

function log_debug(message) {
}

function MissionSuccessRate(mission, followers, mission_score) {
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
        log_debug("follower id: " + follower.garrFollowerID)

        var is_dancer = false
        follower.ability.forEach(function(ability) {
            var detail = g_garrison_abilities[ability.id]
            if (detail.trait) {
                traits[ability.id] = traits[ability.id] || 0
                traits[ability.id] += 1

                if (ability.id == 232) {  // dancer
                    is_dancer = true
                } else if (detail.category == 1 || detail.category == 6) {
                    // slayer / environment preference
                    if (detail.counters.indexOf(mission.type) >= 0) {
                        log_debug(detail.name)
                        mission_type_countered = true;
                    }
                } else if (detail.category == 4) {  // racial preference
                    if (MatchRace(detail.race, followers, follower.garrFollowerID)) {
                        log_debug(detail.name)
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

    log_debug("my score: " + my_score)

    if (my_score > mission_score) my_score = mission_score

    return my_score
}

function MatchRace(race, followers, my_id) {
    return followers.some(function(follower) {
        if (follower.garrFollowerID == my_id) return false
        return race.indexOf(g_garrison_followers[follower.garrFollowerID].horde.race) >= 0
    })
}
