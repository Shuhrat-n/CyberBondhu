INSERT INTO scenarios (title_en, title_bn, message_en, message_bn, category) VALUES
('Suspicious Bank Message', 'সন্দেহজনক ব্যাংক বার্তা',
 'Dear customer, your bank account will be BLOCKED today. Click http://bit.ly/bnk-verify and enter your PIN to keep it active.',
 'প্রিয় গ্রাহক, আজই আপনার ব্যাংক অ্যাকাউন্ট বন্ধ হয়ে যাবে। সচল রাখতে http://bit.ly/bnk-verify লিংকে ক্লিক করে আপনার পিন দিন।',
 'BANK_PHISHING');

INSERT INTO scenario_choices (scenario_id, text_en, text_bn, safe, feedback_en, feedback_bn) VALUES
(1, 'Click the link and enter my PIN', 'লিংকে ক্লিক করে আমার পিন দিন', false,
 'Careful! Banks never ask for your PIN through a link.', 'সাবধান! ব্যাংক কখনও লিংকের মাধ্যমে পিন চায় না।'),
(1, 'Ignore the message and call my bank', 'বার্তাটি উপেক্ষা করে ব্যাংকে ফোন করুন', true,
 'Correct! Calling your bank on its official number is the safest action.', 'সঠিক! ব্যাংকের অফিসিয়াল নম্বরে ফোন করাই সবচেয়ে নিরাপদ।'),
(1, 'Reply with my account number', 'আমার অ্যাকাউন্ট নম্বর রিপ্লাই করুন', false,
 'Careful! Never share account details with an unknown sender.', 'সাবধান! অচেনা প্রেরককে অ্যাকাউন্টের তথ্য দেবেন না।');