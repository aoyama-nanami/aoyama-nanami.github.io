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
    var start_time = new Date().getTime()

    var t454 = MasterPlan({ "ability": [6, 3, 10, 1, 2, 9, 7], "type": 18}, "#mission_table_454", 10)
    var t455 = MasterPlan({ "ability": [2, 6, 1, 3, 3, 10, 8], "type": 21}, "#mission_table_455", 10)
    var t456 = MasterPlan({ "ability": [4, 7, 6, 7, 4, 8, 3], "type": 24}, "#mission_table_456", 10)
    var t457 = MasterPlan({ "ability": [1, 2, 6, 3, 9, 10, 8], "type": 11}, "#mission_table_457", 10)

    var best_list = []
    var best = 999
    for (var i = 0; t454[i].score >= 690; i++) {
        for (var j = 0; t455[j].score >= 690; j++) {
            for (var k = 0; t456[k].score >= 690; k++) {
                for (var l = 0; t457[l].score >= 690; l++) {
                    var o = {}
                    o[t454[i].party[0]] = 1;
                    o[t454[i].party[1]] = 1;
                    o[t454[i].party[2]] = 1;
                    
                    o[t455[j].party[0]] = 1;
                    o[t455[j].party[1]] = 1;
                    o[t455[j].party[2]] = 1;
                    
                    o[t456[k].party[0]] = 1;
                    o[t456[k].party[1]] = 1;
                    o[t456[k].party[2]] = 1;
                    
                    o[t457[l].party[0]] = 1;
                    o[t457[l].party[1]] = 1;
                    o[t457[l].party[2]] = 1;

                    var keys = Object.keys(o)
                    var elements = [
                        t454[i].element, 
                        t455[j].element, 
                        t456[k].element, 
                        t457[l].element] 
                    if (keys.length < best) {
                        best = keys.length
                        best_list = []
                    }
                    if (keys.length <= best) {
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

function MasterPlan(mission, output_table, limit) {
    var result = []

    for (var i = 0; i < my_followers.length; i++) {
        for (var j = i + 1; j < my_followers.length; j++) {
            for (var k = j + 1; k < my_followers.length; k++) {
                var score = MissionSuccessRate(
                    { "ability": mission.ability.slice(0), "type": mission.type},
                    [my_followers[i], my_followers[j], my_followers[k]]
                )
                result.push({"score": score, "party": [i, j, k]})
            }
        }
    }

    result.sort(function(x, y) { return y.score - x.score })

    for (var i = 0; i < result.length; i++) {
        var r = result[i]
        if (r.score < 690) break
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
