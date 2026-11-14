// =====================================================================
//  PODACI APLIKACIJE (originalni plan)
//  Izvori: Personalizovan plan v2/v2.1 (trening 12 meseci),
//  Jelovnik 4 nedelje v3.1, suplementi "Kosti & zubi" + sportski,
//  znanje iz slika i beleški. Sve se može menjati u aplikaciji.
// =====================================================================

const DEFAULT_DATA = {
  version: 3,

  // ------------------------------------------------------------------
  //  VEŽBE (biblioteka) — slika: img/ex/<id>-0.jpg i -1.jpg
  // ------------------------------------------------------------------
  exercises: {
    bench: { name: "Bench press", en: "Potisak sa ravne klupe (šipka)", muscles: "Grudi · prednja ramena · triceps",
      tips: ["Lopatice skupi i spusti, stopala čvrsto na podu", "Šipku spuštaj kontrolisano do sredine grudi", "Laktovi pod ~45°, ne raširene u stranu"] },
    incline_db: { name: "Kosi potisak bučicama", en: "Incline dumbbell press", muscles: "Gornje grudi · ramena · triceps",
      tips: ["Klupa na 30–45°", "Bučice spuštaj do visine grudi, lagano rastegni", "Gore ih ne udaraj jednu o drugu"] },
    dips: { name: "Propadanja (dips)", en: "Weighted / machine dips", muscles: "Donje grudi · triceps",
      tips: ["Blago nagni trup napred za grudi", "Spusti se dok rame ne bude malo ispod lakta", "Ako boli rame — skrati amplitudu ili koristi mašinu"] },
    fly: { name: "Razvlačenje (pec deck / sajla)", en: "Cable fly / pec deck", muscles: "Grudi",
      tips: ["Laktovi blago savijeni i fiksirani", "Na sredini stisni grudi 1 sekundu", "Polako nazad, oseti istezanje"] },
    pushdown: { name: "Triceps na sajli", en: "Triceps pushdown", muscles: "Triceps",
      tips: ["Laktovi zalepljeni uz telo", "Dole potpuno opruži i stisni", "Ne pomaži se ramenima i trupom"] },
    oh_tri: { name: "Triceps iznad glave", en: "Overhead triceps extension", muscles: "Triceps (duga glava)",
      tips: ["Laktovi gledaju napred, blizu glave", "Spusti iza glave do punog istezanja", "Kontrolisano, bez trzanja"] },
    ab_rollout: { name: "Točak za trbušnjake", en: "Ab rollout", muscles: "Trbušnjaci · jezgro",
      tips: ["Kreni sa kolena", "Leđa ne smeju da propadnu — zategni stomak", "Idi napred samo koliko možeš da kontrolišeš"] },
    deadlift: { name: "Mrtvo dizanje", en: "Deadlift (ili trap bar)", muscles: "Leđa · gluteus · zadnja loža",
      tips: ["Šipka blizu nogu, iznad sredine stopala", "Leđa ravna, grudi gore, zategni pre podizanja", "Guraj pod nogama, kukovi i ramena idu zajedno"] },
    row: { name: "Veslanje šipkom", en: "Barbell row", muscles: "Leđa (sredina) · zadnja ramena · biceps",
      tips: ["Trup nagnut ~45°, leđa ravna", "Vuci šipku ka pupku", "Gore stisni lopatice"] },
    pullup: { name: "Zgibovi / Lat mašina", en: "Pull-ups / Lat pulldown", muscles: "Široki leđni · biceps",
      tips: ["Kreni od spuštenih lopatica", "Vuci laktove ka rebrima", "Kontrolisano dole do punog istezanja"] },
    chest_row: { name: "Veslanje sa osloncem na grudima", en: "Chest-supported row", muscles: "Leđa · zadnja ramena",
      tips: ["Grudi na kosoj klupi, bez ljuljanja", "Vuci laktove nazad i gore", "Stisni lopatice 1 sekundu"] },
    curl: { name: "Pregib za biceps", en: "Biceps curl", muscles: "Biceps",
      tips: ["Laktovi mirni uz telo", "Na vrhu stisni", "Spuštaj sporo (2–3 s)"] },
    hammer: { name: "Čekić pregib", en: "Hammer curl", muscles: "Biceps · brahijalis · podlaktica",
      tips: ["Dlanovi okrenuti jedan ka drugom", "Bez zamaha trupom", "Puna amplituda"] },
    hlr: { name: "Podizanje nogu u visu", en: "Hanging leg raises", muscles: "Donji trbušnjaci",
      tips: ["Vis na šipci, bez ljuljanja", "Podigni noge/kolena podvijanjem karlice", "Spuštaj polako"] },
    squat: { name: "Čučanj", en: "Back squat (ili hack squat)", muscles: "Kvadricepsi · gluteus",
      tips: ["Stopala u širini ramena, prsti blago napolje", "Kolena prate prste, leđa neutralna", "Spusti se bar do paralele, guraj kroz pete"] },
    legpress: { name: "Leg press", en: "Leg press", muscles: "Kvadricepsi · gluteus",
      tips: ["Donji deo leđa zalepljen za sedište", "Ne zaključavaj kolena gore", "Kontrolisano spuštanje"] },
    rdl: { name: "Rumunsko mrtvo dizanje", en: "Romanian deadlift (RDL)", muscles: "Zadnja loža · gluteus",
      tips: ["Kolena blago savijena i fiksirana", "Kukove guraj nazad, šipka klizi niz noge", "Stani kad osetiš jako istezanje lože"] },
    legcurl: { name: "Pregib nogu (zadnja loža)", en: "Leg curl", muscles: "Zadnja loža",
      tips: ["Kukovi zalepljeni za klupu", "Gore stisni 1 sekundu", "Spuštaj sporo"] },
    legext: { name: "Opružanje nogu", en: "Leg extension", muscles: "Kvadricepsi",
      tips: ["Leđa uz naslon", "Gore potpuno opruži i stisni", "Bez trzanja"] },
    calf: { name: "Listovi (podizanje na prste)", en: "Calf raises", muscles: "Listovi",
      tips: ["Dole puno istezanje", "Gore pauza 1 sekundu", "Polako — listovi vole sporo"] },
    hiit: { name: "HIIT (kratko)", en: "Sprint intervali", muscles: "Kondicija · sagorevanje",
      tips: ["30 s sprint + 60 s lagan hod", "8–10 krugova (traka, bicikl ili napolju)", "Ako su noge 'ubijene' posle čučnja — bicikl"] },
    russian: { name: "Ruski twist", en: "Russian twists (sa težinom)", muscles: "Kosi trbušnjaci",
      tips: ["Trup nagnut nazad ~45°, stopala mogu na podu", "Rotiraj ramena, ne samo ruke", "10 na svaku stranu"] },
    ohp: { name: "Potisak iznad glave", en: "Overhead press (OHP)", muscles: "Ramena · triceps",
      tips: ["Zategni gluteus i stomak, ne zabacuj se", "Šipka ide pravo gore, glava 'kroz prozor'", "Gore potpuno opruži"] },
    lateral: { name: "Odručenje bučicama", en: "Lateral raises", muscles: "Bočna ramena",
      tips: ["Laktovi blago savijeni", "Podiži do visine ramena, ne više", "Lagana težina, bez zamaha"] },
    facepull: { name: "Face pull / zadnja ramena", en: "Face pull / rear delt fly", muscles: "Zadnja ramena · rotatori",
      tips: ["Uže na visini lica", "Vuci ka čelu, laktovi visoko i napolje", "Na kraju rotiraj šake nazad"] },
    shrug: { name: "Sleganje ramenima", en: "Shrugs", muscles: "Trapez",
      tips: ["Ramena pravo gore ka ušima", "Pauza 1 s na vrhu", "Bez kruženja ramenima"] },
    pulldown: { name: "Lat povlačenje", en: "Lat pulldown", muscles: "Široki leđni",
      tips: ["Blago nagni trup nazad", "Vuci šipku do gornjeg dela grudi", "Kontrolisano gore"] },
    plank: { name: "Plank sa opterećenjem", en: "Weighted plank", muscles: "Jezgro",
      tips: ["Telo u pravoj liniji", "Stisni gluteus i stomak", "Ploča na leđima samo ako je forma savršena"] },
    goblet: { name: "Front / goblet čučanj", en: "Front squat / goblet squat", muscles: "Kvadricepsi · jezgro",
      tips: ["Teg drži uz grudi", "Trup uspravan", "Laktovi idu između kolena dole"] },
    incline_machine: { name: "Kosi potisak na mašini", en: "Incline machine press", muscles: "Gornje grudi · ramena",
      tips: ["Podesi sedište da ručke budu u visini grudi", "Kontrolisano nazad", "Ne zaključavaj laktove"] },
    zone2: { name: "Kardio Zona 2", en: "Zone 2 kardio", muscles: "Srce · kondicija",
      tips: ["Tempo u kom možeš da pričaš, ali ne pevaš", "Bicikl, traka na nagibu ili orbitrek", "Puls oko 60–70% maksimuma"] },
    bicycle: { name: "Bicikl trbušnjaci", en: "Bicycle crunches", muscles: "Trbušnjaci · kosi",
      tips: ["Lakat ka suprotnom kolenu", "Sporo i kontrolisano", "Donji deo leđa uz pod"] },
    // ---- zamene (mesec 4 i 10)
    incline_bench: { name: "Kosi bench (šipka)", en: "Incline bench press", muscles: "Gornje grudi · ramena",
      tips: ["Klupa 30°", "Šipku spuštaj na gornji deo grudi", "Lopatice skupljene"] },
    tbar: { name: "T-bar veslanje", en: "T-bar row", muscles: "Leđa",
      tips: ["Grudi gore, leđa ravna", "Vuci ka stomaku", "Stisni lopatice"] },
    hack: { name: "Hack čučanj", en: "Hack squat / front squat", muscles: "Kvadricepsi",
      tips: ["Leđa uz naslon", "Duboko i kontrolisano", "Guraj kroz celo stopalo"] },
    hipthrust: { name: "Hip thrust", en: "Hip thrust", muscles: "Gluteus · zadnja loža",
      tips: ["Lopatice na klupi", "Gore stisni gluteus 1–2 s", "Brada blago ka grudima"] },
    sumo: { name: "Sumo mrtvo dizanje", en: "Sumo deadlift", muscles: "Gluteus · unutrašnja loža · leđa",
      tips: ["Široki stav, prsti napolje", "Hvat unutar nogu", "Kolena guraj napolje"] },
    arnold: { name: "Arnold potisak", en: "Arnold press", muscles: "Ramena",
      tips: ["Kreni sa dlanovima ka sebi", "Rotiraj dok potiskuješ gore", "Kontrolisano nazad"] },
    reverse_crunch: { name: "Obrnuti trbušnjaci", en: "Reverse crunch", muscles: "Donji trbušnjaci",
      tips: ["Leđa na podu", "Podigni karlicu ka grudima", "Bez zamaha"] },
    upright: { name: "Uspravno veslanje", en: "Upright row", muscles: "Ramena · trapez",
      tips: ["Širi hvat (štedi ramena)", "Laktovi vode, do visine ramena", "Ako bocka rame — preskoči"] },
  },

  // ------------------------------------------------------------------
  //  NEDELJA TRENINGA (12-mesečni program, v2)
  //  dan: 0=Ned 1=Pon 2=Uto 3=Sre 4=Čet 5=Pet 6=Sub
  //  main: glavna vežba (u mesecima intenzifikacije ide teže)
  // ------------------------------------------------------------------
  workouts: {
    1: { title: "Push", subtitle: "Grudi + triceps", duration: "75–110 min", items: [
      { ex: "bench", sets: 4, reps: "5–8", rest: "90–150 s", main: true },
      { ex: "incline_db", sets: 3, reps: "8–12", rest: "90 s" },
      { ex: "dips", sets: 3, reps: "6–10", rest: "90 s" },
      { ex: "fly", sets: 3, reps: "12–15", rest: "60 s", iso: true },
      { ex: "pushdown", sets: 3, reps: "10–15", rest: "60 s", iso: true },
      { ex: "oh_tri", sets: 2, reps: "12–15", rest: "60 s", iso: true },
      { ex: "ab_rollout", sets: 3, reps: "12–15", rest: "30 s", core: true },
    ]},
    2: { title: "Pull", subtitle: "Leđa + biceps", duration: "75–110 min", items: [
      { ex: "deadlift", sets: 3, reps: "3–6", rest: "150 s", main: true },
      { ex: "row", sets: 4, reps: "6–10", rest: "120 s" },
      { ex: "pullup", sets: 4, reps: "6–12", rest: "90 s" },
      { ex: "chest_row", sets: 3, reps: "8–12", rest: "90 s" },
      { ex: "curl", sets: 3, reps: "8–12", rest: "60 s", iso: true },
      { ex: "hammer", sets: 2, reps: "10–15", rest: "60 s", iso: true },
      { ex: "hlr", sets: 3, reps: "10–12", rest: "30 s", core: true },
    ]},
    3: { title: "Noge", subtitle: "Noge + kratko HIIT", duration: "70–100 min", items: [
      { ex: "squat", sets: 4, reps: "5–8", rest: "120 s", main: true },
      { ex: "legpress", sets: 3, reps: "8–12", rest: "120 s" },
      { ex: "rdl", sets: 3, reps: "6–10", rest: "120 s" },
      { ex: "legcurl", sets: 3, reps: "10–15", rest: "75–90 s", iso: true },
      { ex: "legext", sets: 2, reps: "12–15", rest: "75 s", iso: true },
      { ex: "calf", sets: 4, reps: "10–20", rest: "60 s", iso: true },
      { ex: "russian", sets: 3, reps: "20 (10/strana)", rest: "30 s", core: true },
      { ex: "hiit", sets: 1, reps: "8–10 krugova", rest: "—", cardio: true },
    ]},
    5: { title: "Ramena", subtitle: "Ramena + trap + dodatno leđa", duration: "70–100 min", items: [
      { ex: "ohp", sets: 4, reps: "5–8", rest: "120 s", main: true },
      { ex: "lateral", sets: 4, reps: "10–20", rest: "60 s", iso: true },
      { ex: "facepull", sets: 4, reps: "12–20", rest: "60 s", iso: true },
      { ex: "shrug", sets: 3, reps: "8–15", rest: "75 s", iso: true },
      { ex: "pulldown", sets: 2, reps: "12–15", rest: "75 s" },
      { ex: "plank", sets: 3, reps: "60 s", rest: "30 s", core: true },
    ]},
    6: { title: "Celo telo", subtitle: "Celo telo + kardio Zona 2", duration: "60–95 min", items: [
      { ex: "goblet", sets: 3, reps: "8–12", rest: "90 s" },
      { ex: "incline_machine", sets: 3, reps: "8–12", rest: "90 s" },
      { ex: "pulldown", sets: 3, reps: "10–12", rest: "75–90 s" },
      { ex: "rdl", sets: 2, reps: "10–12 (lagano)", rest: "90 s" },
      { ex: "bicycle", sets: 3, reps: "15–20", rest: "30 s", core: true },
      { ex: "zone2", sets: 1, reps: "25–35 min", rest: "—", cardio: true },
    ]},
  },
  restDays: {
    4: { title: "Odmor", subtitle: "Odmor / mobilnost", text: "Šetnja 20–30 min, istezanje, mobilnost kukova i ramena. Cilj 7–10k koraka." },
    0: { title: "Odmor", subtitle: "Potpuni odmor", text: "Lagano kretanje i šetnja. Dobar dan za pripremu obroka za narednu nedelju i potapanje badema." },
  },

  warmup: "5–8 min lagan kardio + 2–3 serije zagrevanja (lakše) za prvu vežbu.",

  // ------------------------------------------------------------------
  //  12 MESECI — svaki mesec: 3 nedelje napred + 4. nedelja deload
  // ------------------------------------------------------------------
  months: [
    { m: 1, focus: "Baza + volumen", text: "Glavne vežbe 5–8 ponavljanja, dodatne 8–12, izolacije 12–20. RIR 2–3 (ostavi 2–3 ponavljanja u rezervi)." },
    { m: 2, focus: "Baza + volumen", text: "Isto kao mesec 1, ali dodaj +1 seriju na 2–3 glavne vežbe. Dvostruka progresija: prvo ponavljanja, pa kilaža." },
    { m: 3, focus: "Baza + volumen", text: "Glavne 5–8, dodatne 8–12, izolacije 12–20. Pokušaj da prva vežba ide malo teže (4–7 ponavljanja)." },
    { m: 4, focus: "Deload + zamene vežbi", text: "Prva nedelja lakše (RIR 3–4). Ceo mesec rade se ZAMENE vežbi da se odmore zglobovi.", swap: "A", deloadWeek1: true },
    { m: 5, focus: "Intenzifikacija (snaga + masa)", text: "Prva (glavna) vežba 3–6 ponavljanja, ostalo 6–12. Kardio Zona 2 2× nedeljno po 20–25 min.", reps: { main: "3–6", sec: "6–12" } },
    { m: 6, focus: "Intenzifikacija (snaga + masa)", text: "Prva vežba 3–6 ponavljanja, ostalo 6–12. Teške serije, ali čista tehnika.", reps: { main: "3–6", sec: "6–12" } },
    { m: 7, focus: "Deload + mini PR", text: "Nedelja 1 deload; nedelje 2–4 progresija do jednog teškog seta od 3–5 ponavljanja (mini rekord).", deloadWeek1: true, reps: { main: "3–5" } },
    { m: 8, focus: "Hipertrofija — 2. talas", text: "Glavne 6–10, dodatne 8–15, izolacije 12–25. Više serija. Zona 2: 2–3× po 25–35 min.", reps: { main: "6–10", sec: "8–15", iso: "12–25" } },
    { m: 9, focus: "Hipertrofija — 2. talas", text: "Glavne 6–10, dodatne 8–15, izolacije 12–25.", reps: { main: "6–10", sec: "8–15", iso: "12–25" } },
    { m: 10, focus: "Deload + zamene (ponovo)", text: "Prva nedelja lakše (RIR 3–4). Rotiraj vežbe (zamene), smanji serije.", swap: "B", deloadWeek1: true },
    { m: 11, focus: "Masa ili rekompozicija + kondicija", text: "Zadrži teške serije 4–8, volumen 8–15. Zona 2 + kratak HIIT.", reps: { main: "4–8", sec: "8–15" } },
    { m: 12, focus: "Masa ili rekompozicija + kondicija", text: "Zadrži teške serije 4–8, volumen 8–15. Na kraju meseca — procena i novi plan.", reps: { main: "4–8", sec: "8–15" } },
  ],
  swaps: {
    A: { bench: "incline_bench", row: "tbar", squat: "hack", rdl: "hipthrust", deadlift: "sumo" },
    B: { ohp: "arnold", deadlift: "sumo", row: "tbar", hlr: "reverse_crunch", bicycle: "reverse_crunch" },
  },

  trainingRules: [
    "Dvostruka progresija: prvo dižeš ponavljanja do gornje granice, pa onda +2.5–5% kilaže.",
    "Glavne vežbe: RIR 1–2 (ostavi 1–2 ponavljanja u rezervi). Izolacije mogu do otkaza na poslednjoj seriji.",
    "Deload (svake 4. nedelje): ~40% manje serija, tehnika, ne ideš do otkaza.",
    "Glavne vežbe uvek prve, izolacije posle.",
    "Pad energije usred treninga → sledeći put 20–30 g brzih UH pre (galete/banana).",
    "Zglobovi bole → ubaci zamene vežbi ranije i smanji serije izolacija.",
  ],

  // ------------------------------------------------------------------
  //  ISHRANA — obroci (biblioteka) i 4-nedeljna rotacija (v3.1)
  // ------------------------------------------------------------------
  meals: {
    // doručci
    d_ovas: { name: "Ovsena kaša sa bananom", items: ["Ovsene pahuljice 90 g", "Banana 120 g", "Mleveni lan 10 g (ili chia 10 g)", "Biljno mleko 250 ml", "Vege protein 30 g"], mins: 7,
      prep: ["Ovsene pahuljice prelij biljnim mlekom i kuvaj 3–5 min uz mešanje (ili ih prelij uveče i ostavi u frižideru preko noći).","Vege protein prvo razmuti u malo mleka, pa ga umešaj u kašu kad je skloniš sa vatre (da se ne zgrudva).","Dodaj isečenu bananu i mleveni lan (ili chia)."] },
    d_heljda: { name: "Heljda sa bobičastim voćem", items: ["Heljda 80 g", "Bobičasto voće 150 g", "Mleveni lan 10 g (ili chia 10 g)", "Biljno mleko 250 ml", "Vege protein 25–30 g"], mins: 15,
      prep: ["Heljdu isperi i kuvaj 12–15 min u 2× više vode (može se skuvati unapred za 2–3 dana).","Prelij toplim biljnim mlekom.","Umešaj razmućen vege protein, dodaj bobičasto voće (može i smrznuto) i mleveni lan."] },
    d_zeleni: { name: "Zelena ovsena (smoothie/kaša)", items: ["Banana 120 g", "Spanać 50 g", "Ovsene pahuljice 60 g", "Mleveni lan 10 g (ili chia 10 g)", "Vege protein 30 g", "Voda"], mins: 3,
      prep: ["U blender stavi bananu, spanać, ovsene pahuljice, mleveni lan, vege protein i 250–300 ml vode.","Blendaj 40–60 s dok ne bude glatko.","Pij odmah ili jedi kašikom kao gustu kašu."] },
    d_proso: { name: "Proso sa jabukom i cimetom", items: ["Proso 80 g", "Jabuka 150 g", "Cimet", "Mleveni lan 10 g (ili chia 10 g)", "Vege protein 30 g", "Biljno mleko 250 ml"], mins: 20,
      prep: ["Proso isperi toplom vodom i kuvaj 15–20 min u 2,5× više vode (može unapred za 2–3 dana).","Dodaj biljno mleko, seckanu ili rendanu jabuku i cimet, pa prokuvaj 2 min.","Skloni sa vatre, umešaj razmućen vege protein i mleveni lan."] },
    // pre treninga
    p_galete: { name: "Galete + džem + šejk", items: ["Pirinčane galete 5–6", "Džem 20–30 g", "Vege protein 25–30 g (u vodi)"], mins: 2,
      prep: ["Galete namaži džemom.","Vege protein promućkaj u šejkeru sa 250–300 ml vode.","Jedi 45–60 min pre treninga, bez masti (bez tahinija, sira i orašastog)."] },
    p_banana: { name: "Banana + galete + šejk", items: ["Banana 1 kom", "Pirinčane galete 3–4", "Vege protein 25–30 g"], mins: 2,
      prep: ["Vege protein promućkaj u šejkeru sa 250–300 ml vode.","Uz šejk pojedi bananu i 3–4 galete.","45–60 min pre treninga."] },
    p_ovas: { name: "Ovsene + med + šejk", items: ["Ovsene pahuljice 40 g", "Džem ili med 15 g", "Vege protein 25–30 g (u vodi)"], mins: 5,
      prep: ["Ovsene pahuljice prelij sa 100 ml vrele vode i ostavi 3 min da nabubre.","Umešaj džem ili med.","Vege protein promućkaj u šejkeru sa 250–300 ml vode."] },
    p_krompir: { name: "Kuvani krompir + šejk", items: ["Kuvani krompir 300 g + so", "Vege protein 25–30 g"], mins: 25,
      prep: ["Krompir oljušti, iseci na kocke i kuvaj 15–20 min u slanoj vodi (može se skuvati uveče za sutra).","Posoli. Može topao ili hladan.","Vege protein promućkaj u šejkeru sa 250–300 ml vode."] },
    // ručkovi
    r_kinoa: { name: "Kinoa + tofu + tahini", items: ["Kinoa 100 g (sirovo)", "Tofu 200 g", "Povrće 250 g", "Tahini 15 g"], mins: 20,
      prep: ["Kinou dobro isperi u cediljci (skida gorčinu), pa kuvaj 15 min u 2× više vode, poklopljeno.","Tofu ocedi, iseci na kocke i peci 8–10 min u tiganju sa malo ulja, dok ne porumeni sa svih strana.","Povrće (npr. brokoli, paprika, tikvice) prodinstaj 5–7 min ili skuvaj na pari.","Sve stavi u činiju i prelij tahinijem razmućenim sa malo limuna i vode."] },
    r_pirinac: { name: "Integralni pirinač + tempeh", items: ["Integralni pirinač 110 g (sirovo)", "Tempeh 160 g", "Povrće 250 g", "Susam 15 g"], mins: 30,
      prep: ["Integralni pirinač isperi i kuvaj 25–30 min u 2,5× više vode (može unapred za 2–3 dana).","Tempeh iseci na listiće i peci 3–4 min sa svake strane (ukusnije uz malo soja sosa).","Povrće (npr. brokoli, paprika, šargarepa) prodinstaj 5–7 min.","Sve složi u činiju i pospi susamom."] },
    r_testenina: { name: "Integralna testenina + TVP", items: ["Integralna testenina 120 g (sirovo)", "TVP (sojine mrvice) 80 g suvo", "Paradajz sos", "Susam 15 g"], mins: 15,
      prep: ["TVP prelij vrelom vodom ili supom (1:1) i ostavi 10 min da nabubri, pa ocedi.","Testeninu kuvaj u slanoj vodi po uputstvu sa kesice (8–12 min).","TVP proprži 3–4 min, dodaj paradajz sos i krčkaj 5 min (kao bolonjeze).","Pomešaj sa testeninom i pospi susamom."] },
    r_bulgur: { name: "Bulgur + crni pasulj", items: ["Bulgur 120 g (sirovo)", "Crni pasulj kuvani 300 g", "Salsa", "Povrće"], mins: 15,
      prep: ["Bulgur prelij sa 2× više vrele vode, poklopi i ostavi 12–15 min (ne mora da se kuva).","Crni pasulj iz konzerve isperi i zagrej (ili koristi skuvan unapred).","Dodaj povrće (paprika, kukuruz, paradajz) i salsu, pa promešaj."] },
    r_kinoa_odmor: { name: "Kinoa + tofu (odmor)", items: ["Kinoa 80 g (sirovo)", "Tofu 220 g", "Povrće 300 g", "Tahini 15 g"], mins: 20,
      prep: ["Kinou dobro isperi u cediljci (skida gorčinu), pa kuvaj 15 min u 2× više vode, poklopljeno.","Tofu ocedi, iseci na kocke i peci 8–10 min u tiganju sa malo ulja, dok ne porumeni sa svih strana.","Povrće (npr. brokoli, paprika, tikvice) prodinstaj 5–7 min ili skuvaj na pari.","Sve stavi u činiju i prelij tahinijem razmućenim sa malo limuna i vode."] },
    r_salata: { name: "Velika salata sa pasuljem", items: ["Velika salata", "Pasulj kuvani 300 g", "Avokado 70 g", "Susam 15 g"], mins: 10,
      prep: ["U veliku činiju iseci zelenu salatu, paradajz i krastavac.","Dodaj kuvan pasulj (iz konzerve isperi) i avokado na kockice.","Začini limunom i solju, pa pospi susamom."] },
    r_tempeh_heljda: { name: "Tempeh + heljda", items: ["Tempeh 180 g", "Povrće 300 g", "Heljda 70 g", "Tahini 15 g"], mins: 20,
      prep: ["Heljdu isperi i kuvaj 12–15 min u 2× više vode.","Tempeh iseci na listiće i peci 3–4 min sa svake strane.","Povrće (npr. brokoli, paprika, tikvice) prodinstaj 5–7 min.","Sve u činiju, prelij tahinijem razmućenim sa limunom."] },
    // užine
    u_humus: { name: "Humus + povrće + semenke", items: ["Humus 120 g", "Šargarepa / krastavac", "Bundeva semenke 25–30 g"], mins: 3,
      prep: ["Šargarepu i krastavac iseci na štapiće.","Umači ih u humus.","Uz to pojedi bundeva semenke."] },
    u_jabuka: { name: "Jabuka + bademi + semenke", items: ["Jabuka 200 g", "Bademi 25 g (potopljeni)", "Bundeva semenke 25 g"], mins: 1,
      prep: ["Jabuka + bademi (potopljeni od prethodne večeri, oceđeni) + bundeva semenke.","Ništa se ne sprema, može i u kutiji za poneti."] },
    u_jaja: { name: "Jaja + integralni hleb", items: ["2 jaja", "Paradajz", "Integralni hleb 80 g", "Bundeva semenke 25 g"], mins: 10,
      prep: ["Jaja skuvaj 8–9 min (tvrdo) ili ih ispeci kao omlet.","Uz paradajz i integralni hleb.","Bundeva semenke sa strane."] },
    u_kakao: { name: "Proteinski kakao šejk", items: ["Vege protein 30 g + voda", "Kakao / cimet", "Bundeva semenke 25 g (sa strane)"], mins: 2,
      prep: ["Vege protein, 1 kašičica kakaa i malo cimeta promućkaj u šejkeru sa 300 ml vode.","Bundeva semenke pojedi sa strane."] },
    u_sir: { name: "Mladi sir + voće", items: ["Mladi sir 100 g", "Voće 200 g", "Bundeva semenke 25 g"], mins: 2,
      prep: ["Mladi sir stavi u činiju.","Dodaj iseckano voće (npr. jabuka, kruška, bobičasto ili banana).","Pospi bundeva semenkama."] },
    u_humus_galete: { name: "Humus + galete", items: ["Humus 120 g", "Pirinčane galete 3–4", "Bundeva semenke 25 g"], mins: 2,
      prep: ["Galete namaži humusom.","Uz to pojedi bundeva semenke."] },
    u_jaja_salata: { name: "Jaja + hleb + salata", items: ["2 jaja", "Integralni hleb 70 g", "Salata", "Bundeva semenke 25 g"], mins: 10,
      prep: ["Jaja skuvaj 8–9 min (tvrdo) ili ih ispeci.","Uz integralni hleb i salatu (zelena salata, paradajz, krastavac).","Bundeva semenke sa strane."] },
    // večere
    v_socivo: { name: "Sočivo sa povrćem", items: ["Sočivo kuvano 300 g", "Povrće 250 g", "Ulje 10 ml"], mins: 30,
      prep: ["Sočivo isperi. Crveno kuvaj 15–20 min, zeleno ili braon 25–30 min (može veća tura unapred).","Na ulju proprži luk i povrće (šargarepa, paprika, tikvice) 5 min.","Dodaj sočivo i začine (so, biber, aleva paprika, kim) i krčkaj još 5 min.","300 g kuvanog sočiva je oko 120 g suvog."] },
    v_pasulj: { name: "Beli pasulj + salata", items: ["Beli pasulj kuvani 300 g", "Salata", "Ulje 10 ml"], mins: 10,
      prep: ["Beli pasulj iz konzerve isperi (ili ga skuvaj unapred: potopi preko noći pa kuvaj 60–90 min).","Zagrej ga sa uljem, biberom i lovorom, ili napravi salatu sa crnim lukom.","Uz salatu (zelena salata, paradajz, krastavac)."] },
    v_tofu: { name: "Tofu + tikvice/paprika + pirinač", items: ["Tofu 220 g", "Tikvice / paprika 300 g", "Pirinač 70 g (sirovo)"], mins: 25,
      prep: ["Pirinač isperi i kuvaj 15–18 min u 2× više vode.","Tofu iseci na kocke i peci 8–10 min u tiganju sa malo ulja.","Dodaj tikvice i papriku, dinstaj još 5–7 min i začini (so, biber, beli luk, soja sos)."] },
    v_jaja: { name: "Jaja + spanać + pečurke + krompir", items: ["3 jaja", "Spanać", "Pečurke", "Krompir 250 g"], mins: 25,
      prep: ["Krompir skuvaj (15–20 min) ili ispeci u rerni na 200 °C 25 min.","Pečurke proprži 5 min, pa dodaj spanać da uvene 1–2 min.","Umuti 3 jaja, prelij preko povrća i ispeci kao omlet."] },
    // pre spavanja
    s_caj: { name: "Čaj", items: ["Čaj (kamilica / nana)", "Opciono: mini šejk 20–25 g ako je tog dana falio protein"], mins: 5,
      prep: ["Skuvaj čaj od kamilice ili nane (5 min).","Ako je tog dana falio protein: mini šejk od 20–25 g vege proteina u vodi."] },
  },

  // vreme obroka
  slotsTraining: [
    { key: "dor", time: "08:00", label: "Doručak" },
    { key: "pre", time: "10:15", label: "Pre treninga" },
    { key: "trening", time: "11:00", label: "Trening (11–13h)" },
    { key: "posle", time: "13:30", label: "Posle treninga (ručak)" },
    { key: "uz", time: "16:30", label: "Užina" },
    { key: "vec", time: "20:30", label: "Večera" },
    { key: "spav", time: "22:30", label: "Pre spavanja" },
  ],
  slotsRest: [
    { key: "dor", time: "08:00", label: "Doručak" },
    { key: "uz1", time: "11:00", label: "Užina" },
    { key: "ruc", time: "14:00", label: "Ručak" },
    { key: "uz2", time: "17:30", label: "Užina" },
    { key: "vec", time: "20:30", label: "Večera" },
    { key: "spav", time: "22:30", label: "Pre spavanja" },
  ],

  // dnevni tipovi — trening dani se rotiraju A/B/C/D
  dayTypes: {
    A: { label: "Trening dan A", dor: "d_ovas", pre: "p_galete", posle: "r_kinoa", uz: "u_humus", vec: "v_socivo", spav: "s_caj" },
    B: { label: "Trening dan B", dor: "d_heljda", pre: "p_banana", posle: "r_pirinac", uz: "u_jabuka", vec: "v_pasulj", spav: "s_caj" },
    C: { label: "Trening dan C", dor: "d_zeleni", pre: "p_ovas", posle: "r_testenina", uz: "u_jaja", vec: "v_tofu", spav: "s_caj" },
    D: { label: "Trening dan D", dor: "d_proso", pre: "p_krompir", posle: "r_bulgur", uz: "u_kakao", vec: "v_jaja", spav: "s_caj" },
    O1: { label: "Odmor 1", rest: true, dor: "d_proso", uz1: "u_kakao", ruc: "r_kinoa_odmor", uz2: "u_sir", vec: "v_jaja", spav: "s_caj" },
    O2: { label: "Odmor 2", rest: true, dor: "d_zeleni", uz1: "u_jaja", ruc: "r_kinoa_odmor", uz2: "u_sir", vec: "v_tofu", spav: "s_caj" },
    O3: { label: "Odmor 3", rest: true, dor: "d_zeleni", uz1: "u_jaja", ruc: "r_salata", uz2: "u_humus_galete", vec: "v_tofu", spav: "s_caj" },
    O4: { label: "Odmor 4", rest: true, dor: "d_heljda", uz1: "u_jabuka", ruc: "r_salata", uz2: "u_humus_galete", vec: "v_pasulj", spav: "s_caj" },
    O5: { label: "Odmor 5", rest: true, dor: "d_heljda", uz1: "u_jabuka", ruc: "r_tempeh_heljda", uz2: "u_jaja_salata", vec: "v_pasulj", spav: "s_caj" },
    O6: { label: "Odmor 6", rest: true, dor: "d_ovas", uz1: "u_humus", ruc: "r_tempeh_heljda", uz2: "u_jaja_salata", vec: "v_socivo", spav: "s_caj" },
    O7: { label: "Odmor 7", rest: true, dor: "d_ovas", uz1: "u_humus", ruc: "r_kinoa_odmor", uz2: "u_sir", vec: "v_socivo", spav: "s_caj" },
    O8: { label: "Odmor 8", rest: true, dor: "d_proso", uz1: "u_kakao", ruc: "r_kinoa_odmor", uz2: "u_sir", vec: "v_jaja", spav: "s_caj" },
  },
  // 4 nedelje × 7 dana (index 0=Pon ... 6=Ned)
  mealRotation: [
    ["A", "B", "C", "O1", "A", "B", "O2"],
    ["D", "A", "B", "O3", "D", "A", "O4"],
    ["C", "D", "A", "O5", "C", "D", "O6"],
    ["B", "C", "D", "O7", "B", "C", "O8"],
  ],

  nutritionTargets: [
    { label: "Trening dan", kcal: "≈ 2970 kcal", macro: "Proteini 159 g · UH 431 g · Masti 68 g" },
    { label: "Dan odmora", kcal: "≈ 2820 kcal", macro: "Proteini 159 g · UH 393 g · Masti 68 g" },
  ],
  nutritionRules: [
    "Cilj: čista masa — +0.2 do +0.4 kg nedeljno.",
    "Najveći obrok sa ugljenim hidratima ide POSLE treninga (13–14h).",
    "Pre treninga (10:15) drži masti nisko — bez veće količine sira/fete.",
    "Feta 30–50 g/dan (slana i masnija) — posle treninga ili uveče.",
    "Mladi sir 50–100 g/dan je ok u užini ili večeri.",
    "Sir je dodatak, a glavni protein su tofu, tempeh, mahunarke i šejk.",
    "Svaki dan: bundeva semenke 25–30 g, tahini/susam 15–20 g, mahunarke 250–350 g kuvano, mleveni lan 10 g.",
    "Jod: koristi jodiranu so u kući.",
    "Voda: oko 2.5–3 L dnevno + još tokom treninga (obavezno uz kreatin).",
    "Korekcije radi najviše jednom u 2 nedelje (±150 kcal), ne menjaj stalno.",
  ],

  // svaki dan, van obroka (smuti + užina za kosti) — ulazi u nedeljnu kupovinu
  shopDaily: ["Banana 0.5 kom", "Sok od narandže 200 ml", "Bundeva semenke 15 g", "Suve smokve 3 kom", "Bademi 20 g"],

  shopping: [
    { cat: "Žitarice i skrob", items: ["Ovsene pahuljice", "Heljda", "Proso", "Kinoa", "Integralni pirinač", "Bulgur", "Integralna testenina", "Pirinčane galete", "Integralni hleb", "Krompir"] },
    { cat: "Proteini", items: ["Tofu", "Tempeh", "TVP (sojine mrvice)", "Vege protein (grašak + pirinač)", "Jaja", "Mladi sir", "Feta"] },
    { cat: "Mahunarke", items: ["Sočivo", "Beli pasulj", "Crni pasulj", "Humus / leblebije"] },
    { cat: "Semenke i orašasto", items: ["Bundeva semenke", "Mleveni lan", "Chia", "Tahini", "Susam", "Bademi", "Suve smokve"] },
    { cat: "Voće", items: ["Banane", "Bobičasto voće", "Jabuke", "Narandže (sok)", "Avokado"] },
    { cat: "Povrće", items: ["Spanać", "Tikvice", "Paprika", "Pečurke", "Šargarepa", "Krastavac", "Paradajz", "Salata / rukola", "Brokoli"] },
    { cat: "Ostalo", items: ["Biljno mleko", "Džem / med", "Paradajz sos", "Salsa", "Maslinovo ulje", "Cimet", "Kakao", "Jodirana so", "Čaj (kamilica, nana, rastavić)"] },
  ],

  // ------------------------------------------------------------------
  //  SUPLEMENTI — jedan sređen raspored
  //  days: "all" | "train" | "rest"
  // ------------------------------------------------------------------
  supplements: [
    { id: "smuti", time: "07:30", days: "all", name: "Jutarnji smuti „Kosti & zubi“", dose: "1 čaša", note: "Spirulina, hlorela, pšenična trava, ječmena trava, kopriva, šipurak, bundeva semenke, kolagen, ½ banane, sok od narandže. Popiti odmah.", color: "green",
      why: "Minerali, vitamin C i kolagen za kosti, zube i desni." },
    { id: "k2", time: "07:30", days: "all", name: "Dr. Viton K2 Komplex", dose: "1 kapsula", note: "Uz smuti. D3 + K2 (MK-7) + Ca + Mg + Zn.", color: "purple",
      how: ["1 kapsula uz smuti."],
      why: "D3 apsorbuje kalcijum, K2 ga usmerava u kosti i zube — ne u arterije." },
    { id: "kafa", time: "08:30", days: "all", name: "Kafa — tek sada", dose: "", note: "Najranije 60 min posle smutija (tanini blokiraju gvožđe i cink).", color: "gray", noCheck: true,
      how: ["Kafa najranije 60 min posle smutija."],
      why: "Tanini i kofein blokiraju gvožđe, cink i magnezijum iz smutija." },
    { id: "protein", time: "13:30", days: "train", name: "Šejk posle treninga", dose: "Vege protein 30–40 g + kreatin 5 g", note: "Jedan šejk: protein i kreatin zajedno.", color: "orange",
      how: ["U šejker stavi 30–40 g vege proteina (grašak + pirinač) i 5 g kreatina monohidrata.", "Dodaj 300–400 ml vode ili biljnog mleka i promućkaj.", "Popij odmah posle treninga."],
      why: "Protein za oporavak i rast mišića; kreatin za snagu i oporavak." },
    { id: "kreatin_o", time: "14:00", days: "rest", name: "Kreatin monohidrat", dose: "5 g", note: "Uz ručak — i na dan odmora.", color: "orange",
      how: ["5 g kreatina u čaši vode ili soka, uz ručak."],
      why: "Kreatin se uzima svaki dan, i kad ne treniraš." },
    { id: "rastavic", time: "15:30", days: "all", name: "Čaj od rastavića", dose: "1 šolja", note: "Odvojeno od obroka. 3 meseca piješ, pa 1 mesec pauza.", color: "blue",
      how: ["1 kašiku suvog rastavića prelij sa 250 ml vrele (ne ključale) vode.","Poklopi i ostavi 10–15 min, pa procedi.","Pij odvojeno od obroka, ne u smutiju."],
      why: "Silicijum za kolagen, kosti i nokte." },
    { id: "smokve", time: "18:30", days: "all", name: "Suve smokve + bademi", dose: "3 kom + 20 g", note: "Grickalica između obroka. Bademi potopljeni od prethodne večeri.", color: "brown",
      how: ["Pojedi 3 suve smokve i 20 g badema (potopljenih od prethodne večeri, oceđenih)."],
      why: "Kalcijum, kalijum i magnezijum za kosti." },
    { id: "mg", time: "22:00", days: "all", name: "Magnezijum bisglicinat", dose: "200–300 mg", note: "Opciono — ako imaš grčeve, loš san ili stres.", color: "blue", optional: true,
      how: ["200–300 mg magnezijum bisglicinata (obično 2 kapsule, proveri na kutiji).","30–60 min pre spavanja."],
      why: "Opušta mišiće, bolji san, noćni oporavak." },
    { id: "bademi", time: "22:00", days: "all", name: "Potopi bademe za sutra", dose: "20 g u vodu", note: "8–12 h potapanja razgrađuje fitinsku kiselinu.", color: "gray",
      how: ["20 g badema stavi u čašu i prelij vodom.","Ostavi preko noći (8–12 h), ujutru ih ocedi."],
      why: "Potapanje razgrađuje fitinsku kiselinu, pa se kalcijum i magnezijum bolje upijaju." },
  ],

  smoothie: {
    title: "Jutarnji smuti „Kosti & zubi“",
    subtitle: "Blendati 30–40 s · popiti odmah · ne čuvati",
    items: [
      { name: "Spirulina prah", dose: "1 kašičica", why: "Minerali, B12, detoks" },
      { name: "Hlorela prah", dose: "1 kašičica", why: "Pojačava detoks, Mg, Zn" },
      { name: "Pšenična trava prah", dose: "1 kašičica", why: "Vitamin C, E, imunitet" },
      { name: "Ječmena trava prah", dose: "1 kašičica", why: "Vitamin K, B12, Ca" },
      { name: "Kopriva mlevena", dose: "1 kašičica", why: "Silicijum, Ca, Mg" },
      { name: "Šipurak ili acerola prah", dose: "1 kašičica", why: "Prirodni vitamin C — obavezan!" },
      { name: "Semenke bundeve mlevene", dose: "1 kašika", why: "Glicin, prolin, Zn, Mg" },
      { name: "Kolagen tip 1 (Puori CP1)", dose: "1 merica", why: "Direktni kolagen za kosti, zube i desni" },
      { name: "Banana", dose: "½ komada", why: "Maskira gorčinu algi, kalijum" },
      { name: "Sok od narandže", dose: "200 ml", why: "Vitamin C pojačava apsorpciju gvožđa" },
      { name: "Voda", dose: "100 ml", why: "Konzistencija" },
    ],
    steps: [
      "U blender stavi prahove: spirulina, hlorela, pšenična trava, ječmena trava, kopriva i šipurak (ili acerola) — od svakog po 1 kašičicu.",
      "Dodaj 1 kašiku mlevenih semenki bundeve i 1 mericu kolagena (Puori CP1).",
      "Dodaj ½ banane, 200 ml soka od narandže i 100 ml vode.",
      "Blendaj 30–40 s i popij odmah — ne čuvaj.",
      "Uz smuti popij 1 kapsulu Dr. Viton K2 Komplex.",
      "Kafa tek posle 60 min.",
    ],
    tips: [
      "Ako je pregorko: još ½ banane ili 1 kašika tahinija.",
      "Prvih 3–4 dana spirulinu kreni sa 2 g pa podigni.",
      "Rastavić NE ide u smuti — pije se kao čaj, odvojeno.",
    ],
  },

  golden: [
    { t: "Vitamin C je obavezan uz sve", d: "Bez vitamina C nema sinteze kolagena ni dobre apsorpcije gvožđa iz biljaka. Šipurak/acerola svako jutro u smutiju." },
    { t: "Rastavić uvek kao čaj, odvojeno", d: "Silicijum se bolje izvlači u toploj vodi. Jedna šolja popodne, odvojeno od obroka." },
    { t: "Bademi uvek potopljeni prethodne večeri", d: "Potapanje 8–12 h razgrađuje fitinsku kiselinu koja blokira kalcijum i magnezijum." },
    { t: "Kafa najmanje 60 min posle smutija", d: "Tanini i kofein blokiraju gvožđe, cink i magnezijum." },
    { t: "Magnezijum uveče", d: "Opušta mišiće i pomaže noćnu regeneraciju i san." },
  ],
  combos: {
    good: [
      { t: "Spirulina + šipurak", d: "Vitamin C povećava apsorpciju gvožđa iz spiruline." },
      { t: "Semenke bundeve + acerola", d: "Cink + vitamin C = sinteza kolagena." },
      { t: "Kopriva + rastavić", d: "Dupli silicijum (kopriva u smutiju, rastavić kao čaj)." },
      { t: "Leblebije + limun", d: "Aminokiseline + vitamin C." },
      { t: "Bademi (potopljeni) + smokve", d: "Kalcijum + kalijum — užina za kosti." },
      { t: "Magnezijum (uveče) + san", d: "Bez sna nema oporavka." },
    ],
    bad: [
      { t: "Smuti + kafa odmah", d: "Tanini blokiraju gvožđe i cink — čekaj 60 min." },
      { t: "Rastavić duže od 3 meseca", d: "Može da optereti bubrege. 3 meseca pa 1 mesec pauza." },
      { t: "Spirulina + crni čaj", d: "Isti problem kao kafa. Zeleni čaj manje smeta." },
    ],
  },
  results: "Energija i san: 2–3 nedelje · Nokti i kosa: 4–6 nedelja · Desni i zubi: 6–10 nedelja · Gustina kostiju: 3–6 meseci. Procesi su spori ali trajni — ne odustaj.",

  dailyCore: [
    { t: "Omega-3 (biljno)", d: "Mleveni lan 10 g dnevno (najlakše u kašu/smuti), i/ili chia 10 g, orasi 20–30 g (ne moraju svaki dan, ali često)." },
    { t: "Minerali (cink, magnezijum, gvožđe)", d: "Bundeva semenke 25–30 g, susam/tahini 15–20 g ili mak, mahunarke svaki dan: sočivo/pasulj/leblebije 250–350 g kuvano." },
    { t: "Kalcijum (bez mleka, uz malo sira)", d: "Tofu sa kalcijumom (ako ga nađeš), susam/tahini, brokoli/kupus/kelj, mladi sir 50–100 g ili feta 30–50 g." },
    { t: "Jod", d: "Jodirana so u kući. Ako koristiš alge kao hranu: mala količina nori povremeno (ne preterivati)." },
  ],

  shops: [
    { what: "Spirulina, hlorela, pšenična trava", where: "Zdrava priča / We Are One", price: "3650 din" },
    { what: "Kreatin (Ultimate Nutrition)", where: "Supplement Store", price: "1800 din" },
    { what: "Protein pirinač + grašak", where: "Prečicom do zdravlja", price: "1900 din" },
    { what: "Dr. Viton K2 Komplex", where: "", price: "" },
    { what: "Puori CP1 kolagen", where: "", price: "" },
    { what: "Kopriva, šipurak, rastavić", where: "biljna apoteka", price: "" },
  ],

  // ------------------------------------------------------------------
  //  ZNANJE — kratki članci (tekst: redovi; "## " = podnaslov, "- " = stavka, "a | b" = tabela)
  // ------------------------------------------------------------------
  knowledge: [
    { id: "proteini", icon: "🥇", title: "Najbolji veganski izvori proteina", body:
`## Na 100 g
Spirulina (sušena) | 55–65 g
Sojine pahuljice / TVP | 50–55 g
Proteinski prah (grašak, pirinač, soja) | 70–85 g
Kvasac u pahuljicama | 45–50 g
Tempeh | 18–20 g
Tofu (čvrsti) | 12–15 g
Sočivo (suvo) | 24–26 g
Crni / beli pasulj (suvi) | 21 g
Leblebije (suve) | 19 g
Kinoa (suva) | 14–15 g
Ovas (sirov) | 13–15 g
Heljda (suva) | 13 g
## Orašasto i semenke (više masti)
Bundeve semenke | 24–30 g
Kikiriki | 25–26 g
Bademi | 21 g
Suncokret | 20–21 g
Laneno seme | 18 g
Chia | 17 g
Tahini | 17 g
## Zeleno povrće
Spanać | 2.9 g
Brokoli (kuvan) | 2.8–3.5 g
Kelj | 2.7–4 g
Tikvice, pečurke | 1–3 g
## Zaključak
- Kombinuj mahunarke + žitarice → kompletan aminokiselinski profil
- Šejk od graška + pirinča za lako dostizanje cilja
- Tofu, tempeh i TVP kao glavni izvori u obrocima
- Semenke i orašasto u manjim količinama (kalorijski gusti)
- Spirulina i kvasac su dodaci, ne glavni izvor` },
    { id: "izvori", icon: "🥬", title: "Prirodni izvori vitamina i minerala", body:
`D3 | Sunce 20 min dnevno, jaja, D3 suplement
K2 | Natto, kiseli kupus, jaja iz slobodnog uzgoja
Magnezijum | Spanać, blitva, bademi, tahini, crna čokolada
Cink | Bundeve semenke, leblebije, integralne žitarice
Vitamin C | Paprika, brokoli, acerola, kivi, nar
Kalcijum | Tahini, brokoli, bademi, blitva, mak
## Dnevne doze (orijentaciono)
D3 | 2000–4000 IU
K2 (MK-7) | 100–200 mcg
Magnezijum | 300–400 mg
Cink | 15–30 mg
Vitamin C | 500–1000 mg
Kolagen tip I | 5–10 g` },
    { id: "alternative", icon: "🌿", title: "Prirodne alternative suplementima", body:
`## Magnezijum
- Banane, spanać i kelj, bademi i brazilski orasi, susam
## San (umesto melatonina)
- Čaj od kamilice, lavanda, valerijana (čaj ili tinktura pre spavanja)
## Omega-3 (umesto ribljeg ulja)
- Laneno seme, chia seme, orasi
## Metabolizam (umesto L-karnitina)
- Zeleni čaj, zeleni čili, kurkuma
## Oporavak mišića
- Proteini: soja, grašak/pirinač, tofu, tempeh, mahunarke
- Ugljeni hidrati: kinoa, batat, ovsena kaša, integralni pirinač
- Masti: avokado, maslinovo ulje, orašasto, chia, lan
- Elektroliti: kokosova voda, voda sa limunom i prstohvatom soli
- Antioksidanti: bobičasto voće, spanać, brokoli` },
    { id: "kikiriki", icon: "🥜", title: "Kikiriki puter u prahu (recept)", body:
`## Sastojak
- Gotov 100% prirodan kikiriki puter (bez dodataka)
## Postupak
- Zamrzni tanak sloj na papiru za pečenje 1–2 h (opciono, olakšava)
- Stavi u gazu i iscedi što više ulja (pritisni rukom ili teškim predmetom), ponavljaj dok masa ne bude suva i zrnasta
- Suši u rerni na 60–80 °C 45–90 min (ili dehidrator ~4–6 h na 50 °C)
- Sameljaj u mlinu za kafu ili blenderu
- Prosej kroz sito za finiju teksturu (opciono)
## Napomene
- Manje masti i duži rok trajanja
- Možeš dodati malo soli, kokosovog šećera ili biljni protein` },
    { id: "pojmovi", icon: "📖", title: "Pojmovi u treningu", body:
`RIR | Koliko ponavljanja ti je ostalo u rezervi (RIR 2 = mogao si još 2)
Deload | Lakša nedelja: ~40% manje serija, bez otkaza — telo se oporavlja
Dvostruka progresija | Prvo dižeš ponavljanja do gornje granice, pa tek onda kilažu
TUT | Vreme pod tenzijom — spor, kontrolisan rad i zadržavanje u sredini pokreta
Tempo | Koliko sekundi gore, pauza, koliko dole (serija ukupno ~40–60 s)
HIIT | Visokointenzivni intervali (npr. 30 s sprint / 60 s hod)
Zona 2 | Lagan kardio u kome možeš da pričaš (≈60–70% maks. pulsa)
Top set | Najteža serija dana posle zagrevanja` },
    { id: "oporavak", icon: "😴", title: "Oporavak i praćenje", body:
`- San: 7.5–9 h (bez sna višak kalorija ide u mast)
- Koraci: 7–10 hiljada dnevno
- Voda: 30–40 ml po kg (~2.3–3 L) + trening
- Težina: meri ujutro, gledaj trend kroz nedelje
- Struk: 1× nedeljno ujutro. Ako raste 0.5–1 cm mesečno uz mali rast snage → previše kalorija
- Snaga: prati glavne vežbe (bench, čučanj, veslanje, OHP)
## Mini-čeklista dana
- Da li sam pogodio protein?
- Da li sam imao 2 obroka sa dobrim UH oko treninga?
- Da li sam napredovao ili bar zadržao snagu?
- Da li sam spavao dovoljno?` },
  ],
};
