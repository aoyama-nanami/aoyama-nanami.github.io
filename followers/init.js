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
    for (var i = 0; i < party.party.length; i++) {
        tr.append($("<td>").append(CreateFollowerTooltip(my_followers[party.party[i]])))
    }
    return tr
}


function GetMissionList() {
    var get_mission = function(id) {
        var raw_data = missions[id]
        var ability = []

        for (var i in raw_data.encounters) {
            var mechanics = raw_data.encounters[i].mechanics
            for (var j in mechanics) {
                ability.push(mechanics[j].type)
            }
        }

        return {
            "id": id,
            "slot": raw_data.followers,
            "type": raw_data.mechanics.type,
            "ability": ability,
            "name": raw_data.name,
        }
    }

    return Array.prototype.map.call(arguments, get_mission)
}

$(document).ready(function() {
    var blackrock_missions = GetMissionList(454, 455, 456, 457)
    var highmaul_missions = GetMissionList(321, 322, 323, 324)
    var elemental_rune_missions = GetMissionList(408, 409, 410, 411, 412, 413)
    var lessons_of_the_blade = GetMissionList(503)
    var apexis_crystal_missions = GetMissionList(391, 399)

    var button_factory = function(name, missions, required_ilv, max_ilv) {
        var button = $("<button>")
            .text(name)
            .addClass("request_worker")
            .click(function(){Compute(missions, required_ilv, max_ilv)})
        $("#button_container").append(button)
    }

    button_factory("blckrock", blackrock_missions, 660, 675)
    button_factory("highmaul", highmaul_missions, 645, 660)
    button_factory("elemental rune", elemental_rune_missions, 645, 660)
    button_factory("retrain", lessons_of_the_blade, 675, 675)
    button_factory("apexis crystal", apexis_crystal_missions, 675, 675)
})

function Compute(missions, required_ilv, max_ilv) {
    var start_time = new Date().getTime()

    var container = $("#result_container")
    container.empty()
    $("#minimal_party, #message").empty()
    $("button.request_worker").prop("disabled", true)

    for (var i = 0; i < missions.length; i++) {
        missions[i].score = 90 * missions[i].ability.length + 30 * missions[i].slot
        delete missions[i].element
    }

    var worker = new Worker("worker.js")
    worker.postMessage({"missions": missions, "followers": my_followers,
        "required_ilv": required_ilv, "max_ilv": max_ilv,
        "garrison_abilities": g_garrison_abilities, "garrison_followers": g_garrison_followers,})

    for (var i = 0; i < missions.length; i++) {
        var a = $("<a>").attr("href", "http://ptr.wowhead.com/mission=" + missions[i].id)
            .addClass("mission_link")
        var table = $("<table>")
        missions[i].element = table
        container.append([a, table, "<hr/>"])
    }

    var output_tables = missions.map(function(m){ return m.element })

    worker.onmessage = function(e) {
        var message = e.data.message
        if (message) {
            $("#message").append([$("<span>").text(message), "<br/>"])
        }

        var candidates = e.data.candidates
        if (candidates == undefined) return

        console.log(candidates)
        candidates.forEach(function(parties, i) {
            parties.forEach(function(x, j) {
                var e = CreateFollowerPartyRow(x, missions[i].score)
                $(output_tables[i]).append(e)
            })
        })
        $WowheadPower.refreshLinks()
    }

}
