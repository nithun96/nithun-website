// Compiled into both the app and the widget extension.

import SwiftUI

extension Color {
    /// The website's --sage (light #4F6B30, dark #8FAF6E)
    static let sage = Color(UIColor { $0.userInterfaceStyle == .dark
        ? UIColor(red: 0x8F/255, green: 0xAF/255, blue: 0x6E/255, alpha: 1)
        : UIColor(red: 0x4F/255, green: 0x6B/255, blue: 0x30/255, alpha: 1) })
}
