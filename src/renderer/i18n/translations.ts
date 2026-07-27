export type Language = 'en' | 'si';

export const translations = {
  en: {
    // App & Nav
    'app.title': 'Audio-to-Word Converter',
    'app.subtitle': 'AI Voice Studio',
    'nav.converter': 'Audio Converter',
    'nav.users': 'User Management',
    'nav.logout': 'Logout',
    'nav.user': 'User',
    'nav.admin': 'Admin',
    'nav.language': 'Language',

    // Login Screen
    'login.welcome': 'Welcome Back',
    'login.subtitle': 'Sign in to access Audio-to-Word AI Converter',
    'login.email_label': 'Email Address',
    'login.email_placeholder': 'name@company.com',
    'login.password_label': 'Password',
    'login.password_placeholder': 'Enter your password',
    'login.button': 'Sign In',
    'login.logging_in': 'Signing In...',
    'login.error_invalid': 'Invalid email or password.',
    'login.footer': 'Audio-to-Word Studio • Enterprise Edition',

    // Audio Picker & Converter
    'converter.title': 'Audio File Converter',
    'converter.subtitle': 'Convert voice recordings into formatted Microsoft Word (.docx) documents',
    'converter.drop_title': 'Select or Drop Audio Files',
    'converter.drop_desc_single': 'Supports MP3, WAV, M4A, AAC, FLAC, OGG (Single file)',
    'converter.drop_desc_multi': 'Supports up to 3 Audio files (MP3, WAV, M4A, AAC, FLAC, OGG)',
    'converter.btn_browse': 'Browse File',
    'converter.btn_browse_multi': 'Browse Files (Max 3)',
    'converter.selected_single': 'Selected File',
    'converter.selected_multi': 'Selected Audio Files (Will be merged)',
    'converter.change_file': 'Change File',
    'converter.change_files': 'Change Files',

    // Options
    'options.multi_label': 'Allow multiple audio files (Up to 3)',
    'options.multi_desc': 'Merge up to 3 tracks into a single high-accuracy document',
    'options.accuracy_label': 'Make more accurate merging compared audio files',
    'options.accuracy_desc': 'Uses deep multi-pass AI comparison to eliminate background noise and garbled words',

    // Progress & Action
    'converter.btn_convert': 'Convert to Word (.docx)',
    'converter.btn_converting': 'Converting Audio...',
    'converter.status_reading': 'Reading audio file data...',
    'converter.status_transcribing': 'Transcribing audio content...',
    'converter.status_merging': 'Comparing and merging multiple audio tracks...',
    'converter.status_docx': 'Generating formatted Word document...',
    'converter.status_completed': 'Conversion completed successfully!',
    'converter.status_error': 'Conversion Failed',

    // Result Card
    'result.success_title': 'Document Created Successfully!',
    'result.output_path': 'Saved Location:',
    'result.btn_open': 'Open Output Folder',
    'result.btn_convert_another': 'Convert Another Audio',
    'result.preview_title': 'Transcription Summary Preview:',

    // User Management
    'users.title': 'User Management',
    'users.subtitle': 'Manage application users and access permissions',
    'users.btn_add': 'Add New User',
    'users.col_name': 'Name',
    'users.col_email': 'Email',
    'users.col_role': 'Role',
    'users.col_created': 'Created Date',
    'users.col_actions': 'Actions',
    'users.badge_admin': 'Admin',
    'users.badge_user': 'User',
    'users.btn_edit': 'Edit',
    'users.btn_delete': 'Delete',
    'users.no_users': 'No users found.',
    'users.confirm_delete': 'Are you sure you want to delete user',

    // User Modal
    'modal.add_title': 'Create New User Account',
    'modal.edit_title': 'Edit User Account',
    'modal.name_label': 'Full Name',
    'modal.name_placeholder': 'e.g. Nimal Perera',
    'modal.email_label': 'Email Address',
    'modal.email_placeholder': 'user@example.com',
    'modal.password_label': 'Password',
    'modal.password_placeholder_edit': 'Leave blank to keep existing password',
    'modal.password_placeholder_add': 'Minimum 6 characters',
    'modal.role_label': 'User Role',
    'modal.role_user': 'Standard User',
    'modal.role_admin': 'Administrator',
    'modal.btn_cancel': 'Cancel',
    'modal.btn_save': 'Save User',
    'modal.btn_saving': 'Saving...',

    // Alerts & Common
    'common.error': 'Error',
    'common.success': 'Success',
    'common.close': 'Close',

    // Audio Editor
    'editor.set_start': 'Set Start',
    'editor.set_end': 'Set End',
    'editor.label_start': 'Start:',
    'editor.label_end': 'End:'
  },
  si: {
    // App & Nav
    'app.title': 'ඔඩියෝ-වර්ඩ් පරිවර්තකය',
    'app.subtitle': 'AI හඬ ස්ටූඩියෝව',
    'nav.converter': 'ඔඩියෝ පරිවර්තකය',
    'nav.users': 'පරිශීලක කළමනාකරණය',
    'nav.logout': 'නික්මෙන්න',
    'nav.user': 'පරිශීලක',
    'nav.admin': 'පරිපාලක',
    'nav.language': 'භාෂාව',

    // Login Screen
    'login.welcome': 'සාදරයෙන් පිළිගනිමු',
    'login.subtitle': 'ඔඩියෝ-වර්ඩ් AI පරිවර්තකය භාවිතයට පිවිසෙන්න',
    'login.email_label': 'විද්‍යුත් තැපැල් ලිපිනය (Email)',
    'login.email_placeholder': 'name@company.com',
    'login.password_label': 'මුරපදය (Password)',
    'login.password_placeholder': 'ඔබගේ මුරපදය ඇතුළත් කරන්න',
    'login.button': 'පිවිසෙන්න',
    'login.logging_in': 'පිවිසෙමින් පවතී...',
    'login.error_invalid': 'විද්‍යුත් තැපෑල හෝ මුරපදය වැරදියි.',
    'login.footer': 'ඔඩියෝ-වර්ඩ් ස්ටූඩියෝව • ව්‍යාපාරික සංස්කරණය',

    // Audio Picker & Converter
    'converter.title': 'ඔඩියෝ ගොනු පරිවර්තකය',
    'converter.subtitle': 'හඬ පටිගත කිරීම් නිවැරදි Microsoft Word (.docx) ලේඛන බවට පරිවර්තනය කරන්න',
    'converter.drop_title': 'ඔඩියෝ ගොනුව තෝරන්න හෝ මෙතැනට දමන්න',
    'converter.drop_desc_single': 'MP3, WAV, M4A, AAC, FLAC, OGG සහාය දක්වයි (තනි ගොනුවක්)',
    'converter.drop_desc_multi': 'ඔඩියෝ ගොනු 3 ක් දක්වා සහාය දක්වයි (MP3, WAV, M4A, AAC, FLAC, OGG)',
    'converter.btn_browse': 'ගොනුව තෝරන්න',
    'converter.btn_browse_multi': 'ගොනු තෝරන්න (උපරිම 3)',
    'converter.selected_single': 'තෝරාගත් ගොනුව',
    'converter.selected_multi': 'තෝරාගත් ඔඩියෝ ගොනු (එකට එකතු කරනු ලැබේ)',
    'converter.change_file': 'ගොනුව වෙනස් කරන්න',
    'converter.change_files': 'ගොනු වෙනස් කරන්න',

    // Options
    'options.multi_label': 'බහු ඔඩියෝ ගොනු (3 දක්වා) තේරීමට ඉඩ දෙන්න',
    'options.multi_desc': 'ඉහළ නිවැරදි භාවයක් සඳහා ගොනු 3 ක් එකම ලේඛනයකට එකතු කරන්න',
    'options.accuracy_label': 'සංසන්දනාත්මක සම්බන්ධ කිරීම හරහා වඩාත් නිවැරදි කරන්න',
    'options.accuracy_desc': 'පසුබිම් ශබ්ද සහ අපැහැදිලි වචන ඉවත් කිරීමට සංසන්දනාත්මක සම්බන්ධ කිරීම භාවිතා කරයි',

    // Progress & Action
    'converter.btn_convert': 'Word (.docx) බවට පරිවර්තනය කරන්න',
    'converter.btn_converting': 'පරිවර්තනය වෙමින් පවතී...',
    'converter.status_reading': 'ඔඩියෝ ගොනුව කියවමින් පවතී...',
    'converter.status_transcribing': 'හඬ පෙළට හරවමින් පවතී...',
    'converter.status_merging': 'බහු ඔඩියෝ පටිගත කිරීම් සසඳමින් එකතු කරයි...',
    'converter.status_docx': 'Word ලේඛනය සකස් කරමින් පවතී...',
    'converter.status_completed': 'පරිවර්තනය සාර්ථකව අවසන් විය!',
    'converter.status_error': 'පරිවර්තනය අසාර්ථක විය',

    // Result Card
    'result.success_title': 'ලේඛනය සාර්ථකව සාදන ලදී!',
    'result.output_path': 'සුරකින ලද ස්ථානය:',
    'result.btn_open': 'ෆෝල්ඩරය විවෘත කරන්න',
    'result.btn_convert_another': 'තවත් ඔඩියෝවක් පරිවර්තනය කරන්න',
    'result.preview_title': 'පරිවර්තනය කරන ලද පෙළ පෙරදසුන:',

    // User Management
    'users.title': 'පරිශීලක කළමනාකරණය',
    'users.subtitle': 'පද්ධති පරිශීලකයින් සහ අවසර කළමනාකරණය කරන්න',
    'users.btn_add': 'නව පරිශීලකයෙකු එකතු කරන්න',
    'users.col_name': 'නම',
    'users.col_email': 'විද්‍යුත් තැපෑල',
    'users.col_role': 'තනතුර',
    'users.col_created': 'සෑදූ දිනය',
    'users.col_actions': 'ක්‍රියාකාරකම්',
    'users.badge_admin': 'පරිපාලක',
    'users.badge_user': 'පරිශීලක',
    'users.btn_edit': 'සංස්කරණය',
    'users.btn_delete': 'මකන්න',
    'users.no_users': 'පරිශීලකයින් හමු නොවීය.',
    'users.confirm_delete': 'ඔබට මෙම පරිශීලකයා සැබවින්ම මකා දැමීමට අවශ්‍යද',

    // User Modal
    'modal.add_title': 'නව පරිශීලක ගිණුමක් සාදන්න',
    'modal.edit_title': 'පරිශීලක ගිණුම සංස්කරණය',
    'modal.name_label': 'සම්පූර්ණ නම',
    'modal.name_placeholder': 'උදා: නිමල් පෙරේරා',
    'modal.email_label': 'විද්‍යුත් තැපෑල',
    'modal.email_placeholder': 'user@example.com',
    'modal.password_label': 'මුරපදය',
    'modal.password_placeholder_edit': 'පවතින මුරපදය තබා ගැනීමට හිස්ව තබන්න',
    'modal.password_placeholder_add': 'අවම වශයෙන් අක්ෂර 6 ක්',
    'modal.role_label': 'පරිශීලක තනතුර',
    'modal.role_user': 'සාමාන්‍ය පරිශීලක',
    'modal.role_admin': 'පරිපාලක',
    'modal.btn_cancel': 'අවලංගු කරන්න',
    'modal.btn_save': 'සුරකින්න',
    'modal.btn_saving': 'සුරකිමින් පවතී...',

    // Alerts & Common
    'common.error': 'දෝෂයකි',
    'common.success': 'සාර්ථකයි',
    'common.close': 'වසා දමන්න',

    // Audio Editor
    'editor.set_start': 'ආරම්භය සකසන්න',
    'editor.set_end': 'අවසානය සකසන්න',
    'editor.label_start': 'ආරම්භය:',
    'editor.label_end': 'අවසානය:'
  }
};
