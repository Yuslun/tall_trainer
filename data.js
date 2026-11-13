// Posisi untuk Forcing Scanner (chess.js menghitung sendiri cek & tangkapan)
const FORCING_POSITIONS = [
  {
    name: "Sicilian Najdorf",
    fen: "r1b1k2r/1pqnbppp/p2ppn2/6B1/3NPP2/2N2Q2/PPP3PP/2KR1B1R w kq - 0 10",
    timeLimit: 180
  },
  {
    name: "Italian Game",
    fen: "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
    timeLimit: 120
  },
  {
    name: "King's Indian",
    fen: "r1bq1rk1/pp2ppbp/2np1np1/8/2BNP3/2N1BP2/PPPQ2PP/R3K2R w KQ - 0 10",
    timeLimit: 180
  }
];

// Posisi untuk Chaos Generator (pilihan tajam dikurasi manual)
const CHAOS_POSITIONS = [
  {
    name: "Najdorf — Sharp Choices",
    fen: "r1b1k2r/1pqnbppp/p2ppn2/6B1/3NPP2/2N2Q2/PPP3PP/2KR1B1R w kq - 0 10",
    sharp: [
      { san: "e5",   note: "dorong bidak, tekanan ke d6/e6" },
      { san: "Bxf6", note: "tukar bishop, hancurkan pertahanan" },
      { san: "g4",   note: "serang sayap raja, ancam g5" },
      { san: "h4",   note: "siapkan rook lift / h5" }
    ]
  },
  {
    name: "Sicilian — Sharp Choices",
    fen: "r1bqk2r/pp2bppp/2n1pn2/2pp4/2PP4/2NBPN2/PP3PPP/R1BQK2R w KQkq - 0 1",
    sharp: [
      { san: "cxd5", note: "buka tengah, dapatkan tempo" },
      { san: "dxc5", note: "tukar, ambil inisiatif" },
      { san: "e4",   note: "dorong, ancam d5" },
      { san: "O-O",  note: "amankan raja sebelum tajam" }
    ]
  },
  {
    name: "King's Indian — Sharp Choices",
    fen: "r1bq1rk1/pp2ppbp/2np1np1/8/2BNP3/2N1BP2/PPPQ2PP/R3K2R w KQ - 0 10",
    sharp: [
      { san: "e5",     note: "dorong, korbankan bidak untuk inisiatif" },
      { san: "Nxc6",   note: "tukar, hancurkan tengah" },
      { san: "Bg5",    note: "pin kuda f6" },
      { san: "O-O-O",  note: "castling panjang, siap serang" }
    ]
  }
];
