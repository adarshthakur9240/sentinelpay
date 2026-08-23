// Generated SentinelPay benchmark, threshold, and sample dataset
export interface ThresholdPoint {
  threshold: number;
  recall: number;
  precision: number;
  f1: number;
  fp_per_10k: number;
  fp_count: number;
  fn_count: number;
  tp_count: number;
  tn_count: number;
  fraud_losses: number;
  friction_costs: number;
  total_cost: number;
  is_optimal: boolean;
}

export interface PRCurvePoint {
  recall: number;
  xgb_precision: number;
  baseline_precision: number;
  no_skill: number;
}

export const THRESHOLD_DATA: ThresholdPoint[] = [
  {
    "threshold": 0.1,
    "recall": 85.14,
    "precision": 79.75,
    "f1": 0.8235,
    "fp_per_10k": 3.7,
    "fp_count": 16,
    "fn_count": 11,
    "tp_count": 63,
    "tn_count": 42632,
    "fraud_losses": 1344.31,
    "friction_costs": 80.0,
    "total_cost": 1424.31,
    "is_optimal": true
  },
  {
    "threshold": 0.2,
    "recall": 82.43,
    "precision": 83.56,
    "f1": 0.8299,
    "fp_per_10k": 2.8,
    "fp_count": 12,
    "fn_count": 13,
    "tp_count": 61,
    "tn_count": 42636,
    "fraud_losses": 1588.73,
    "friction_costs": 60.0,
    "total_cost": 1648.73,
    "is_optimal": false
  },
  {
    "threshold": 0.3,
    "recall": 82.43,
    "precision": 87.14,
    "f1": 0.8472,
    "fp_per_10k": 2.1,
    "fp_count": 9,
    "fn_count": 13,
    "tp_count": 61,
    "tn_count": 42639,
    "fraud_losses": 1588.73,
    "friction_costs": 45.0,
    "total_cost": 1633.73,
    "is_optimal": false
  },
  {
    "threshold": 0.4,
    "recall": 82.43,
    "precision": 87.14,
    "f1": 0.8472,
    "fp_per_10k": 2.1,
    "fp_count": 9,
    "fn_count": 13,
    "tp_count": 61,
    "tn_count": 42639,
    "fraud_losses": 1588.73,
    "friction_costs": 45.0,
    "total_cost": 1633.73,
    "is_optimal": false
  },
  {
    "threshold": 0.5,
    "recall": 82.43,
    "precision": 87.14,
    "f1": 0.8472,
    "fp_per_10k": 2.1,
    "fp_count": 9,
    "fn_count": 13,
    "tp_count": 61,
    "tn_count": 42639,
    "fraud_losses": 1588.73,
    "friction_costs": 45.0,
    "total_cost": 1633.73,
    "is_optimal": false
  },
  {
    "threshold": 0.6,
    "recall": 79.73,
    "precision": 86.76,
    "f1": 0.831,
    "fp_per_10k": 2.1,
    "fp_count": 9,
    "fn_count": 15,
    "tp_count": 59,
    "tn_count": 42639,
    "fraud_losses": 1833.15,
    "friction_costs": 45.0,
    "total_cost": 1878.15,
    "is_optimal": false
  },
  {
    "threshold": 0.7,
    "recall": 79.73,
    "precision": 88.06,
    "f1": 0.8369,
    "fp_per_10k": 1.9,
    "fp_count": 8,
    "fn_count": 15,
    "tp_count": 59,
    "tn_count": 42640,
    "fraud_losses": 1833.15,
    "friction_costs": 40.0,
    "total_cost": 1873.15,
    "is_optimal": false
  },
  {
    "threshold": 0.8,
    "recall": 78.38,
    "precision": 89.23,
    "f1": 0.8345,
    "fp_per_10k": 1.6,
    "fp_count": 7,
    "fn_count": 16,
    "tp_count": 58,
    "tn_count": 42641,
    "fraud_losses": 1955.36,
    "friction_costs": 35.0,
    "total_cost": 1990.36,
    "is_optimal": false
  },
  {
    "threshold": 0.9,
    "recall": 77.03,
    "precision": 95.0,
    "f1": 0.8507,
    "fp_per_10k": 0.7,
    "fp_count": 3,
    "fn_count": 17,
    "tp_count": 57,
    "tn_count": 42645,
    "fraud_losses": 2077.57,
    "friction_costs": 15.0,
    "total_cost": 2092.57,
    "is_optimal": false
  }
];

export const PR_CURVE_DATA: PRCurvePoint[] = [
  {
    "recall": 0.05,
    "xgb_precision": 100.0,
    "baseline_precision": 100.0,
    "no_skill": 0.173
  },
  {
    "recall": 0.082,
    "xgb_precision": 100.0,
    "baseline_precision": 100.0,
    "no_skill": 0.173
  },
  {
    "recall": 0.114,
    "xgb_precision": 100.0,
    "baseline_precision": 100.0,
    "no_skill": 0.173
  },
  {
    "recall": 0.146,
    "xgb_precision": 100.0,
    "baseline_precision": 100.0,
    "no_skill": 0.173
  },
  {
    "recall": 0.178,
    "xgb_precision": 100.0,
    "baseline_precision": 100.0,
    "no_skill": 0.173
  },
  {
    "recall": 0.21,
    "xgb_precision": 100.0,
    "baseline_precision": 100.0,
    "no_skill": 0.173
  },
  {
    "recall": 0.242,
    "xgb_precision": 100.0,
    "baseline_precision": 94.12,
    "no_skill": 0.173
  },
  {
    "recall": 0.274,
    "xgb_precision": 100.0,
    "baseline_precision": 94.12,
    "no_skill": 0.173
  },
  {
    "recall": 0.307,
    "xgb_precision": 100.0,
    "baseline_precision": 94.12,
    "no_skill": 0.173
  },
  {
    "recall": 0.339,
    "xgb_precision": 100.0,
    "baseline_precision": 94.12,
    "no_skill": 0.173
  },
  {
    "recall": 0.371,
    "xgb_precision": 100.0,
    "baseline_precision": 94.12,
    "no_skill": 0.173
  },
  {
    "recall": 0.403,
    "xgb_precision": 100.0,
    "baseline_precision": 94.12,
    "no_skill": 0.173
  },
  {
    "recall": 0.435,
    "xgb_precision": 100.0,
    "baseline_precision": 94.12,
    "no_skill": 0.173
  },
  {
    "recall": 0.467,
    "xgb_precision": 100.0,
    "baseline_precision": 94.59,
    "no_skill": 0.173
  },
  {
    "recall": 0.499,
    "xgb_precision": 100.0,
    "baseline_precision": 94.87,
    "no_skill": 0.173
  },
  {
    "recall": 0.531,
    "xgb_precision": 100.0,
    "baseline_precision": 95.24,
    "no_skill": 0.173
  },
  {
    "recall": 0.563,
    "xgb_precision": 100.0,
    "baseline_precision": 95.45,
    "no_skill": 0.173
  },
  {
    "recall": 0.595,
    "xgb_precision": 100.0,
    "baseline_precision": 95.65,
    "no_skill": 0.173
  },
  {
    "recall": 0.627,
    "xgb_precision": 100.0,
    "baseline_precision": 95.83,
    "no_skill": 0.173
  },
  {
    "recall": 0.659,
    "xgb_precision": 100.0,
    "baseline_precision": 94.23,
    "no_skill": 0.173
  },
  {
    "recall": 0.691,
    "xgb_precision": 96.23,
    "baseline_precision": 94.44,
    "no_skill": 0.173
  },
  {
    "recall": 0.723,
    "xgb_precision": 96.43,
    "baseline_precision": 93.1,
    "no_skill": 0.173
  },
  {
    "recall": 0.756,
    "xgb_precision": 94.92,
    "baseline_precision": 93.33,
    "no_skill": 0.173
  },
  {
    "recall": 0.788,
    "xgb_precision": 87.88,
    "baseline_precision": 90.62,
    "no_skill": 0.173
  },
  {
    "recall": 0.82,
    "xgb_precision": 83.56,
    "baseline_precision": 64.21,
    "no_skill": 0.173
  },
  {
    "recall": 0.852,
    "xgb_precision": 10.52,
    "baseline_precision": 16.71,
    "no_skill": 0.173
  },
  {
    "recall": 0.884,
    "xgb_precision": 6.14,
    "baseline_precision": 4.16,
    "no_skill": 0.173
  },
  {
    "recall": 0.916,
    "xgb_precision": 0.98,
    "baseline_precision": 0.65,
    "no_skill": 0.173
  },
  {
    "recall": 0.948,
    "xgb_precision": 0.66,
    "baseline_precision": 0.5,
    "no_skill": 0.173
  },
  {
    "recall": 0.98,
    "xgb_precision": 0.2,
    "baseline_precision": 0.33,
    "no_skill": 0.173
  }
];

export const SAMPLE_TRANSACTIONS = {
  confirmed_fraud: {
    id: 'TXN-TEST-00404',
    label: 'Real Fraud Attack (Test Set #404)',
    ground_truth: 'FRAUD (Class 1)',
    amount_usd: 122.21,
    features: {
    "Time": 1.5676791557655074,
    "V1": 1.37855899734127,
    "V2": 1.28938093711056,
    "V3": -5.00424678441137,
    "V4": 1.4118498419441,
    "V5": 0.442580635567782,
    "V6": -1.3265359338336,
    "V7": -1.41316995590712,
    "V8": 0.248525467627175,
    "V9": -1.12739593417081,
    "V10": -3.23215317539514,
    "V11": 2.8584658156696,
    "V12": -3.09691489835154,
    "V13": -0.792532436177748,
    "V14": -5.21014084572584,
    "V15": -0.613803263850514,
    "V16": -2.15529688535221,
    "V17": -3.26711568106648,
    "V18": -0.68850546268346,
    "V19": 0.737657217477667,
    "V20": 0.226137945500703,
    "V21": 0.370611857232494,
    "V22": 0.0282344454140697,
    "V23": -0.145640429197154,
    "V24": -0.0810494069107769,
    "V25": 0.521874501959455,
    "V26": 0.739467256056059,
    "V27": 0.389151843520624,
    "V28": 0.186636547522687,
    "Amount": -0.34625344962553
}
  },
  sophisticated_fraud: {
    id: 'TXN-TEST-00805',
    label: 'High-Risk Account Takeover (Test Set #805)',
    ground_truth: 'FRAUD (Class 1)',
    amount_usd: 389.50,
    features: {
    "Time": -1.1318472148579724,
    "V1": -5.31417320646342,
    "V2": 4.14594361146639,
    "V3": -8.53252245892907,
    "V4": 8.34439167363678,
    "V5": -5.71800820787464,
    "V6": -3.04353608094129,
    "V7": -10.9891846672722,
    "V8": 3.40412865609659,
    "V9": -6.16723364181153,
    "V10": -11.435623996076,
    "V11": 7.67453383416429,
    "V12": -14.2960914258331,
    "V13": 0.526938923712363,
    "V14": -15.4450258118019,
    "V15": 0.991651201275811,
    "V16": -12.3913460034009,
    "V17": -22.5416517287861,
    "V18": -7.98672065349455,
    "V19": 2.99255446334225,
    "V20": 1.15001731865814,
    "V21": 2.33146580801509,
    "V22": 0.862996305559532,
    "V23": -0.614453237551036,
    "V24": 0.523647877136623,
    "V25": -0.712593271662611,
    "V26": 0.324637964828057,
    "V27": 2.24509146635599,
    "V28": 0.497320848969724,
    "Amount": -0.0006116347151091
}
  },
  legitimate_regular: {
    id: 'TXN-TEST-00001',
    label: 'Standard Cardholder Transaction (Test Set #1)',
    ground_truth: 'LEGITIMATE (Class 0)',
    amount_usd: 88.29,
    features: {
    "Time": 1.1303853637316712,
    "V1": -1.08860252327554,
    "V2": 0.227684493717604,
    "V3": 1.70446423633482,
    "V4": -2.35333183593795,
    "V5": -0.0205756088947456,
    "V6": -0.172106743175544,
    "V7": 0.583031671396642,
    "V8": 0.0617329021383216,
    "V9": 0.239968628337737,
    "V10": -1.31502430302492,
    "V11": 0.656777603828121,
    "V12": 0.764813769585199,
    "V13": 0.407951980688857,
    "V14": -0.156424317805708,
    "V15": -0.0674871993672851,
    "V16": 0.631197952122071,
    "V17": -1.08135240543906,
    "V18": 0.632738493297563,
    "V19": -0.121099129343154,
    "V20": -0.0738035734416213,
    "V21": 0.217620686602102,
    "V22": 0.653238021876026,
    "V23": -0.327775067273328,
    "V24": -0.315683709621901,
    "V25": 0.583261642757641,
    "V26": 0.743449612737544,
    "V27": -0.120431966266262,
    "V28": 0.0051651175831809,
    "Amount": -0.1121638061444127
}
  },
  legitimate_large: {
    id: 'TXN-TEST-00006',
    label: 'High-Value Valid Purchase (Test Set #6)',
    ground_truth: 'LEGITIMATE (Class 0)',
    amount_usd: 450.00,
    features: {
    "Time": -0.2916038391404316,
    "V1": -0.608276912284286,
    "V2": 0.441774278795917,
    "V3": 2.53124603309437,
    "V4": -0.0302843778539492,
    "V5": -0.343664492177221,
    "V6": 0.367221933272553,
    "V7": 0.102090563668898,
    "V8": 0.129204404136933,
    "V9": 0.393924496829363,
    "V10": -0.225286468825856,
    "V11": 0.4070962636279,
    "V12": -0.0237365149520666,
    "V13": -1.22050219257131,
    "V14": -0.339953417134227,
    "V15": -0.511171778911785,
    "V16": 0.281384905066666,
    "V17": -0.551905905628127,
    "V18": 0.656114441722594,
    "V19": 0.608732411968625,
    "V20": -0.0257165005826563,
    "V21": -0.0316844487638323,
    "V22": 0.102616957470455,
    "V23": -0.262442230097831,
    "V24": 0.0006270764748481,
    "V25": -0.198159355687815,
    "V26": 0.26156112576445,
    "V27": -0.210456154561923,
    "V28": -0.131285917966354,
    "Amount": -0.3097411554701363
}
  }
};
