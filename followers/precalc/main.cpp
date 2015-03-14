#include <iostream>
#include <string>
#include <cassert>
#include <memory>
#include <fstream>
#include <algorithm>
#include <iterator>
#include <regex>
#include <vector>
#include <unordered_map>
#include "./json/json.h"

struct Mission {
    int id;
    int level;
    int itemLevel;
    int followers;
    int baseBonusChance;
    std::string name;
    int mechanicType;
    std::unordered_map<int, int> encounterMechanics;

    explicit Mission(const Json::Value& json);
};

Mission::Mission(const Json::Value& json) {
    id = json["id"].asInt();
    level = json["level"].asInt();
    itemLevel = json["itemlevel"].asInt();
    followers = json["followers"].asInt();
    baseBonusChance = json["basebonuschance"].asInt();
    name = json["name"].asString();
    mechanicType = json["mechanictype"].asInt();
    auto encounters = json["encounters"];
    for (const auto& name : encounters.getMemberNames()) {
        auto mechanics = encounters[name]["mechanics"];
        for (const auto& key : mechanics.getMemberNames()) {
            encounterMechanics[mechanics[key]["type"].asInt()]++;
        }
    }
}

struct Follower {
    int garrFollowerId;
    int level;
    int iLevel;
    std::vector<int> abilities;
    int race;

    Follower(const Json::Value& json, const Json::Value& garrisonFollowersJson);
};

Follower::Follower(const Json::Value& json, const Json::Value& garrisonFollowersJson) {
    garrFollowerId = json["garrFollowerID"].asInt();
    level = json["level"].asInt();
    iLevel = json["iLevel"].asInt();
    for (Json::Value::ArrayIndex i = 0; i < json["ability"].size(); i++) {
        abilities.push_back(json["ability"][i]["id"].asInt());
    }
    race = garrisonFollowersJson[std::to_string(garrFollowerId)]["horde"]["race"].asInt();
}

void ReadJson(const std::string path, Json::Value& out) {
    static Json::Reader reader;
    std::ifstream ifs(path);
    assert(ifs);
    reader.parse(ifs, out, false);
    if (not reader.good()) {
        std::cout << reader.getFormattedErrorMessages() << std::endl;
    }
    assert(reader.good());
}

int main() {
    Json::Value myFollowersJson, garrisonFollowersJson, garrisonAbilitiesJson, garrisonMissionsJson;

    ReadJson("static/my_followers.json", myFollowersJson);
    ReadJson("static/garrison_followers.json", garrisonFollowersJson);
    ReadJson("static/garrison_abilities.json", garrisonAbilitiesJson);
    ReadJson("static/garrison_missions.json", garrisonMissionsJson);

    std::unordered_map<int, Mission> garrisonMissions;
    for (auto& key : garrisonMissionsJson.getMemberNames()) {
        int id = std::stoi(key);
        garrisonMissions.emplace(std::piecewise_construct,
                std::forward_as_tuple(id),
                std::forward_as_tuple(garrisonMissionsJson[key]));
    }

    std::vector<Follower> myFollowers;
    for (Json::Value::ArrayIndex i = 0; i < myFollowersJson.size(); i++) {
        myFollowers.emplace_back(myFollowersJson[i], garrisonFollowersJson);
    }
}
