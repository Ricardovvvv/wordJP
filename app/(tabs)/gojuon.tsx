import { useState } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { speakJapanese } from "../../src/services/tts";

// Data directly from PWA project — verified correct kana
const SEION = [
  [{h:"あ",k:"ア",r:"a"},{h:"い",k:"イ",r:"i"},{h:"う",k:"ウ",r:"u"},{h:"え",k:"エ",r:"e"},{h:"お",k:"オ",r:"o"}],
  [{h:"か",k:"カ",r:"ka"},{h:"き",k:"キ",r:"ki"},{h:"く",k:"ク",r:"ku"},{h:"け",k:"ケ",r:"ke"},{h:"こ",k:"コ",r:"ko"}],
  [{h:"さ",k:"サ",r:"sa"},{h:"し",k:"シ",r:"shi"},{h:"す",k:"ス",r:"su"},{h:"せ",k:"セ",r:"se"},{h:"そ",k:"ソ",r:"so"}],
  [{h:"た",k:"タ",r:"ta"},{h:"ち",k:"チ",r:"chi"},{h:"つ",k:"ツ",r:"tsu"},{h:"て",k:"テ",r:"te"},{h:"と",k:"ト",r:"to"}],
  [{h:"な",k:"ナ",r:"na"},{h:"に",k:"ニ",r:"ni"},{h:"ぬ",k:"ヌ",r:"nu"},{h:"ね",k:"ネ",r:"ne"},{h:"の",k:"ノ",r:"no"}],
  [{h:"は",k:"ハ",r:"ha"},{h:"ひ",k:"ヒ",r:"hi"},{h:"ふ",k:"フ",r:"fu"},{h:"へ",k:"ヘ",r:"he"},{h:"ほ",k:"ホ",r:"ho"}],
  [{h:"ま",k:"マ",r:"ma"},{h:"み",k:"ミ",r:"mi"},{h:"む",k:"ム",r:"mu"},{h:"め",k:"メ",r:"me"},{h:"も",k:"モ",r:"mo"}],
  [{h:"や",k:"ヤ",r:"ya"},null,{h:"ゆ",k:"ユ",r:"yu"},null,{h:"よ",k:"ヨ",r:"yo"}],
  [{h:"ら",k:"ラ",r:"ra"},{h:"り",k:"リ",r:"ri"},{h:"る",k:"ル",r:"ru"},{h:"れ",k:"レ",r:"re"},{h:"ろ",k:"ロ",r:"ro"}],
  [{h:"わ",k:"ワ",r:"wa"},null,null,null,{h:"を",k:"ヲ",r:"wo"}],
  [{h:"ん",k:"ン",r:"n"},null,null,null,null],
];

const DAKUON = [
  [{h:"が",k:"ガ",r:"ga"},{h:"ぎ",k:"ギ",r:"gi"},{h:"ぐ",k:"グ",r:"gu"},{h:"げ",k:"ゲ",r:"ge"},{h:"ご",k:"ゴ",r:"go"}],
  [{h:"ざ",k:"ザ",r:"za"},{h:"じ",k:"ジ",r:"ji"},{h:"ず",k:"ズ",r:"zu"},{h:"ぜ",k:"ゼ",r:"ze"},{h:"ぞ",k:"ゾ",r:"zo"}],
  [{h:"だ",k:"ダ",r:"da"},{h:"ぢ",k:"ヂ",r:"ji"},{h:"づ",k:"ヅ",r:"zu"},{h:"で",k:"デ",r:"de"},{h:"ど",k:"ド",r:"do"}],
  [{h:"ば",k:"バ",r:"ba"},{h:"び",k:"ビ",r:"bi"},{h:"ぶ",k:"ブ",r:"bu"},{h:"べ",k:"ベ",r:"be"},{h:"ぼ",k:"ボ",r:"bo"}],
  [{h:"ぱ",k:"パ",r:"pa"},{h:"ぴ",k:"ピ",r:"pi"},{h:"ぷ",k:"プ",r:"pu"},{h:"ぺ",k:"ペ",r:"pe"},{h:"ぽ",k:"ポ",r:"po"}],
];

const YOUON = [
  [{h:"きゃ",k:"キャ",r:"kya"},{h:"きゅ",k:"キュ",r:"kyu"},{h:"きょ",k:"キョ",r:"kyo"}],
  [{h:"しゃ",k:"シャ",r:"sha"},{h:"しゅ",k:"シュ",r:"shu"},{h:"しょ",k:"ショ",r:"sho"}],
  [{h:"ちゃ",k:"チャ",r:"cha"},{h:"ちゅ",k:"チュ",r:"chu"},{h:"ちょ",k:"チョ",r:"cho"}],
  [{h:"にゃ",k:"ニャ",r:"nya"},{h:"にゅ",k:"ニュ",r:"nyu"},{h:"にょ",k:"ニョ",r:"nyo"}],
  [{h:"ひゃ",k:"ヒャ",r:"hya"},{h:"ひゅ",k:"ヒュ",r:"hyu"},{h:"ひょ",k:"ヒョ",r:"hyo"}],
  [{h:"みゃ",k:"ミャ",r:"mya"},{h:"みゅ",k:"ミュ",r:"myu"},{h:"みょ",k:"ミョ",r:"myo"}],
  [{h:"りゃ",k:"リャ",r:"rya"},{h:"りゅ",k:"リュ",r:"ryu"},{h:"りょ",k:"リョ",r:"ryo"}],
  [{h:"ぎゃ",k:"ギャ",r:"gya"},{h:"ぎゅ",k:"ギュ",r:"gyu"},{h:"ぎょ",k:"ギョ",r:"gyo"}],
  [{h:"じゃ",k:"ジャ",r:"ja"},{h:"じゅ",k:"ジュ",r:"ju"},{h:"じょ",k:"ジョ",r:"jo"}],
  [{h:"びゃ",k:"ビャ",r:"bya"},{h:"びゅ",k:"ビュ",r:"byu"},{h:"びょ",k:"ビョ",r:"byo"}],
  [{h:"ぴゃ",k:"ピャ",r:"pya"},{h:"ぴゅ",k:"ピュ",r:"pyu"},{h:"ぴょ",k:"ピョ",r:"pyo"}],
];

const HEADERS = ["a","i","u","e","o"];

export default function GojuonScreen() {
  const [tab, setTab] = useState<"seion"|"dakuon"|"youon">("seion");
  const labels: Record<string, string> = { seion: "清音", dakuon: "浊音·半浊音", youon: "拗音" };
  const grids: Record<string, (typeof SEION)> = { seion: SEION, dakuon: DAKUON, youon: YOUON };

  return (
    <ScrollView style={gs.container} contentContainerStyle={{ paddingBottom: 30 }}>
      <View style={gs.tabRow}>
        {(["seion","dakuon","youon"] as const).map((t) => (
          <Pressable key={t} onPress={() => setTab(t)} style={[gs.tab, tab === t && gs.tabActive]}>
            <Text style={[gs.tabText, tab === t && gs.tabTextActive]}>{labels[t]}</Text>
          </Pressable>
        ))}
      </View>

      {/* Column headers */}
      <View style={gs.headerRow}>
        <View style={{ width: 32 }} />
        {HEADERS.map((h) => (
          <View key={h} style={gs.headerCell}><Text style={gs.headerText}>{h}</Text></View>
        ))}
      </View>

      {grids[tab].map((row, ri) => (
        <View key={ri} style={gs.gridRow}>
          <View style={{ width: 32, alignItems: "center", justifyContent: "center" }}>
            {row[0] ? <Text style={{ fontSize: 12, color: "#94a3b8", fontWeight: "600" }}>{row[0].r[0]}</Text> : null}
          </View>
          {HEADERS.map((_, ci) => {
            const cell = row[ci];
            if (!cell) return <View key={ci} style={{ flex: 1, margin: 1.5 }} />;
            return (
              <Pressable
                key={ci}
                style={gs.cell}
                onPress={() => speakJapanese(cell.h)}
              >
                <Text style={gs.hiragana}>{cell.h}</Text>
                <Text style={gs.katakana}>{cell.k}</Text>
                <Text style={gs.romaji}>{cell.r}</Text>
              </Pressable>
            );
          })}
        </View>
      ))}
      <Text style={gs.hint}>点击假名可听发音</Text>
    </ScrollView>
  );
}

const gs = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  tabRow: { flexDirection: "row", marginHorizontal: 16, marginTop: 12, marginBottom: 10, gap: 4, backgroundColor: "#f1f5f9", borderRadius: 10, padding: 3 },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: "center" },
  tabActive: { backgroundColor: "#ffffff", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 },
  tabText: { fontSize: 14, fontWeight: "500", color: "#64748b" },
  tabTextActive: { color: "#2563eb", fontWeight: "700" },
  headerRow: { flexDirection: "row", marginHorizontal: 12, marginBottom: 2 },
  headerCell: { flex: 1, alignItems: "center", paddingVertical: 4 },
  headerText: { fontSize: 11, color: "#94a3b8", fontWeight: "600", textTransform: "uppercase" },
  gridRow: { flexDirection: "row", marginHorizontal: 12 },
  cell: {
    flex: 1, backgroundColor: "#ffffff", margin: 1.5, borderRadius: 8, paddingVertical: 8,
    alignItems: "center", borderWidth: 1, borderColor: "#f1f5f9",
  },
  hiragana: { fontSize: 17, fontWeight: "700", color: "#1e293b" },
  katakana: { fontSize: 11, color: "#94a3b8", marginTop: 1 },
  romaji: { fontSize: 10, color: "#94a3b8", marginTop: 1 },
  hint: { textAlign: "center", fontSize: 12, color: "#cbd5e1", marginTop: 16 },
});
