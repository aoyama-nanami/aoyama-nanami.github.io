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

    return span.append(img).append(a).append("<br/>")
}

$(document).ready(function() {
    var t454 = MasterPlan({ "ability": [6, 3, 10, 1, 2, 9, 7], "type": 18}, "#mission_table_454", 10)
    var t455 = MasterPlan({ "ability": [2, 6, 1, 3, 3, 10, 8], "type": 21}, "#mission_table_455", 10)
    var t456 = MasterPlan({ "ability": [4, 7, 6, 7, 4, 8, 3], "type": 24}, "#mission_table_456", 10)
    var t457 = MasterPlan({ "ability": [1, 2, 6, 3, 9, 10, 8], "type": 11}, "#mission_table_457", 10)

    var party = []
    for (var i = 0; t454[i][0] >= 690; i++) {
        for (var j = 0; t455[j][0] >= 690; j++) {
            for (var k = 0; t456[k][0] >= 690; k++) {
                for (var l = 0; t457[l][0] >= 690; l++) {
                    var o = {}
                    o[t454[i][1]] = 1;
                    o[t454[i][2]] = 1;
                    o[t454[i][3]] = 1;
                    
                    o[t455[j][1]] = 1;
                    o[t455[j][2]] = 1;
                    o[t455[j][3]] = 1;
                    
                    o[t456[k][1]] = 1;
                    o[t456[k][2]] = 1;
                    o[t456[k][3]] = 1;
                    
                    o[t457[l][1]] = 1;
                    o[t457[l][2]] = 1;
                    o[t457[l][3]] = 1;

                    var keys = Object.keys(o)
                    if (party.length == 0) {
                        party.push(keys)
                    } else if (keys.length == party[0].length) {
                        party.push(keys)
                    } else if (keys.length < party[0].length) {
                        party = [keys]
                    }
                }
            }
        }
    }
    $.each(party, function(i, p) {
        var tr = $("<tr>")
        $.each(p, function(j, x) {
            var td = $("<td>")
            td.append(CreateFollowerTooltip(my_followers[x]))
            tr.append(td)
        })
        $("#minimal_party").append(tr)
    })
})

function MasterPlan(mission, output_table, limit) {
    var result = []

    for (var i = 0; i < my_followers.length; i++) {
        for (var j = i + 1; j < my_followers.length; j++) {
            for (var k = j + 1; k < my_followers.length; k++) {
                var score = MissionSuccessRate(
                    { "ability": mission.ability.slice(0), "type": mission.type},
                    [my_followers[i], my_followers[j], my_followers[k]]
                )
                result.push([score, i, j, k])
            }
        }
    }

    filtered = result.sort(function(x, y) { return y[0] - x[0] })
        .filter(function(x) {return x[0] >= 690})
   
    $.each(filtered, function(index, r) {
        var tr = $("<tr>")
        tr.append("<td>" + (r[0] * 100 / 720).toFixed(2) + "%</td>")
            .append($("<td>").text(r[0]))
            .append($("<td>").append(CreateFollowerTooltip(my_followers[r[1]])))
            .append($("<td>").append(CreateFollowerTooltip(my_followers[r[2]])))
            .append($("<td>").append(CreateFollowerTooltip(my_followers[r[3]])))
        $(output_table).append(tr)
    })

    return result
}

function log_debug(message) {
}

function MissionSuccessRate(mission_mechanics, followers) {
    var mission_score = 720;  // blackrock raid

    var my_score = 30 * followers.length
    var mission_type_countered = false
    var racial_bonus = 0
    var counter_bonus = 0

    var traits = {}
    var epic_mount = 0
    var high_stamina = 0
    var burst_of_power = 0
    var combat_experience = 0

    $.each(followers, function(index, follower) {
        log_debug("follower id: " + follower.garrFollowerID)
        $.each(follower.ability, function(index2, ability) {
            var detail = g_garrison_abilities[ability.id]
            if (detail.trait) {
                traits[ability.id] = traits[ability.id] || 0
                traits[ability.id] += 1

                if (ability.id == 232) {  // dancer
                } else if (detail.category == 1 || detail.category == 6) {
                    // slayer / environment preference
                    if (detail.counters.indexOf(mission_mechanics.type) >= 0) {
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
                var counters = detail.counters
                $.each(counters, function(index3, counter) {
                    if (typeof(counter) == "undefined") return
                    var pos = mission_mechanics.ability.indexOf(counter)
                    if (pos >= 0) {
                        log_debug(detail.name)
                        delete mission_mechanics.ability[pos]
                        counter_bonus += 1
                    }
                })
            }
        })
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
