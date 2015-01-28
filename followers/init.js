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

$(document).ready(function() {
    var start_time = new Date().getTime()

    var t454 = MasterPlan({ "ability": [6, 3, 10, 1, 2, 9, 7], "type": 18 }, "#mission_table_454", 10)
    var t455 = MasterPlan({ "ability": [2, 6, 1, 3, 3, 10, 8], "type": 21 }, "#mission_table_455", 10)
    var t456 = MasterPlan({ "ability": [4, 7, 6, 7, 4, 8, 3], "type": 24 }, "#mission_table_456", 10)
    var t457 = MasterPlan({ "ability": [1, 2, 6, 3, 9, 10, 8], "type": 11 }, "#mission_table_457", 10)

    var best_list = []
    var best = 9999999
    for (var i = 0; i < t454.length; i++) {
        for (var j = 0; j < t455.length; j++) {
            for (var k = 0; k < t456.length; k++) {
                for (var l = 0; l < t457.length; l++) {
                    var result = CombineParty([t454[i], t455[j], t456[k], t457[l]], my_followers, 660, 675, 720)
                    var keys = result[0]
                    var score = result[1]
                    if (score < best) {
                        best = score
                        best_list = []
                    }
                    if (score <= best) {
                        var elements = [
                            t454[i].element, 
                            t455[j].element, 
                            t456[k].element, 
                            t457[l].element] 
                        best_list.push({"party": keys, "element": elements})
                    }
                }
            }
        }
    }
    $.each(best_list, function(i, p) {
        var tr = $("<tr>")
        $.each(p.party, function(j, x) {
            var td = $("<td>")
            td.append(CreateFollowerTooltip(my_followers[x]))
            tr.append(td)
        })

        $(tr).hover(
            function(){ $.each(p.element, function(i, e) { e.addClass("highlight") }) },
            function(){ $.each(p.element, function(i, e) { e.removeClass("highlight") }) }
        )

        $.each(p.element, function(i, e) { e.addClass("used") })
       
        $("#minimal_party").append(tr)
    })

    $("tr:not(.used)", "#mission_table_454").hide()
    $("tr:not(.used)", "#mission_table_455").hide()
    $("tr:not(.used)", "#mission_table_456").hide()
    $("tr:not(.used)", "#mission_table_457").hide()

    $("#message").text("computation time: " + (new Date().getTime() - start_time) + "ms")
})

function CombineParty(p, followers, required_ilv, max_ilv, required_score) {
    var o = {}
    var max_character_boost = Math.min(15, max_ilv - required_ilv)
    var constraint = []

    $.each(p, function(i, x) {
        o[x.party[0]] = required_ilv;
        o[x.party[1]] = required_ilv;
        o[x.party[2]] = required_ilv;
        var lower_bound = Math.min(required_score - x.score, max_character_boost * x.party.length)
        if (lower_bound > 0) constraint.push({ "variables": x.party, "lower_bound": lower_bound })
    })

    var keys = Object.keys(o)

    var ilv_diff = 0
    $.each(keys, function(i, x) {
        ilv_diff += max_ilv - followers[x].iLevel
    })

    return [keys, ilv_diff]
}

function MasterPlan(mission, output_table, limit) {
    var result = []

    for (var i = 0; i < my_followers.length; i++) {
        for (var j = i + 1; j < my_followers.length; j++) {
            for (var k = j + 1; k < my_followers.length; k++) {
                var score = MissionSuccessRate(
                    mission,
                    [my_followers[i], my_followers[j], my_followers[k]],
                    720
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

    for (var i = 0; i < result.length; i++) {
        var r = result[i]
        var tr = $("<tr>")
        tr.append("<td>" + (r.score * 100 / 720).toFixed(2) + "%</td>")
            .append($("<td>").text(r.score))
            .append($("<td>").append(CreateFollowerTooltip(my_followers[r.party[0]])))
            .append($("<td>").append(CreateFollowerTooltip(my_followers[r.party[1]])))
            .append($("<td>").append(CreateFollowerTooltip(my_followers[r.party[2]])))
        $(output_table).append(tr)
        result[i].element = tr
    }

    return result
}

function log_debug(message) {
}

function MissionSuccessRate(mission_mechanics, followers, mission_score) {
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
    $.each(mission_mechanics.ability, function(index, ability) {
        ability_map[ability] = (ability_map[ability] || 0) + 1
    });

    $.each(followers, function(index, follower) {
        log_debug("follower id: " + follower.garrFollowerID)

        var is_dancer = false
        $.each(follower.ability, function(index2, ability) {
            var detail = g_garrison_abilities[ability.id]
            if (detail.trait) {
                traits[ability.id] = traits[ability.id] || 0
                traits[ability.id] += 1

                if (ability.id == 232) {  // dancer
                    is_dancer = true
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
                $.each(detail.counters, function(index3, counter) {
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
