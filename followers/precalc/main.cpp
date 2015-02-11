#include <iostream>
#include <string>
#include <cassert>
#include <memory>
#include <fstream>
#include <algorithm>
#include <iterator>
#include <regex>
#include <json/json.h>

std::pair<std::string, std::string> ParseDeclaration(const std::string& str) {
    static const std::regex re(R"(^(\s*var\s+)?(\w+)\s*=\s*(.+)\s*;?\s*$)");
    std::smatch match_result;
    assert(std::regex_match(str, match_result, re));
    return {match_result[2], match_result[3]};
}

void ReadJson(const std::string str, Json::Value& out) {
    static Json::Reader reader;
    reader.parse(str, out, false);
    assert(reader.good());
}

void LoadFollowerList(Json::Value& list) {
    std::ifstream fin("follower.js");
    std::string data, line;
    while (std::getline(fin, line)) {
        data += line;
    }
    auto p = ParseDeclaration(data);
    assert(p.first == "my_followers");
    ReadJson(p.second, list);
    assert(list.type() == Json::arrayValue);
}

void LoadWowheadData(Json::Value& garrisonFollowers, Json::Value& garrisonAbilities) {
    std::ifstream fin("data=followers");
    std::string line;
    while (std::getline(fin, line)) {
        auto p = ParseDeclaration(line);
        if (p.first == "g_garrison_followers") {
            assert(garrisonFollowers.type() == Json::nullValue);
            ReadJson(p.second, garrisonFollowers);
        } else if (p.first == "g_garrison_abilities") {
            assert(garrisonAbilities.type() == Json::nullValue);
            ReadJson(p.second, garrisonAbilities);
        }
    }
    assert(garrisonFollowers.type() != Json::nullValue);
    assert(garrisonAbilities.type() != Json::nullValue);
}

int main() {
    Json::Value followerList, garrisonFollowers, garrisonAbilities;
    LoadFollowerList(followerList);
    LoadWowheadData(garrisonFollowers, garrisonAbilities);

    const auto& v = garrisonAbilities[4u];
    std::cout << v["name"].asCString() << std::endl;
}
