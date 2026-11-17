// Deafening Silence — the four sounds, made from numbers.
//
// A line-by-line port of the website's src/audio/noiseRecipes.js, so the app
// sounds exactly like nithun.no/silence. The website stores every stage in a
// Float32Array and does the arithmetic in doubles; this port does the same
// ([Float] storage, Double maths), so the samples match. SilenceTests checks
// that against reference samples taken from the JavaScript.

import Foundation

enum NoiseRecipes {
    /// One buffer, looped. Every slow rhythm repeats a whole number of times in it.
    static let loopSecs = 100

    /// Gain (dB) that brings each sound to the same level (−20 LUFS).
    static let gainDB: [Sound: Double] = [.brown: -4.4, .pink: -5.3, .rain: 0.3, .ocean: -2.7]

    // MARK: Building blocks

    /// Seeded random numbers (−1 … 1), so a sound is the same every time.
    /// Same bit operations as the JavaScript (Math.imul, >>>), on UInt32.
    struct Random {
        var seed: UInt32
        init(_ seed: UInt32) { self.seed = seed }
        mutating func next() -> Double {
            seed = seed &+ 0x6D2B79F5
            var t = (seed ^ (seed >> 15)) &* (1 | seed)
            t = (t &+ ((t ^ (t >> 7)) &* (61 | t))) ^ t
            return Double(t ^ (t >> 14)) / 4294967296 * 2 - 1
        }
    }

    static func white(_ rand: inout Random, _ n: Int) -> [Float] {
        var d = [Float](repeating: 0, count: n)
        for i in 0..<n { d[i] = Float(rand.next()) }
        return d
    }

    /// Paul Kellet's filter — approximates a 1/f spectrum.
    static func pink(_ rand: inout Random, _ n: Int) -> [Float] {
        var d = [Float](repeating: 0, count: n)
        var b0 = 0.0, b1 = 0.0, b2 = 0.0, b3 = 0.0, b4 = 0.0, b5 = 0.0, b6 = 0.0
        for i in 0..<n {
            let w = rand.next()
            b0 = 0.99886 * b0 + w * 0.0555179
            b1 = 0.99332 * b1 + w * 0.0750759
            b2 = 0.96900 * b2 + w * 0.1538520
            b3 = 0.86650 * b3 + w * 0.3104856
            b4 = 0.55000 * b4 + w * 0.5329522
            b5 = -0.7616 * b5 - w * 0.0168980
            d[i] = Float((b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11)
            b6 = w * 0.115926
        }
        return d
    }

    /// Leaky integrator: a random walk that doesn't drift.
    static func brown(_ rand: inout Random, _ n: Int) -> [Float] {
        var d = [Float](repeating: 0, count: n)
        var last = 0.0
        for i in 0..<n {
            last = (last + 0.02 * rand.next()) / 1.02
            d[i] = Float(last * 3.5)
        }
        return d
    }

    enum FilterType { case lowpass, highpass, bandpass }

    /// Biquad as the Web Audio API defines it (Audio EQ Cookbook; lowpass/highpass Q in dB).
    static func biquad(_ input: [Float], _ rate: Double, _ type: FilterType, _ freq: Double, _ q: Double) -> [Float] {
        let w0 = 2 * Double.pi * freq / rate
        let c = cos(w0), s = sin(w0)
        let alpha = type == .bandpass ? s / (2 * q) : s / (2 * pow(10, q / 20))
        let b0, b1, b2: Double
        switch type {
        case .lowpass:  b0 = (1 - c) / 2; b1 = 1 - c;     b2 = b0
        case .highpass: b0 = (1 + c) / 2; b1 = -(1 + c); b2 = b0
        case .bandpass: b0 = alpha;       b1 = 0;         b2 = -alpha
        }
        let a0 = 1 + alpha, a1 = -2 * c, a2 = 1 - alpha
        var d = [Float](repeating: 0, count: input.count)
        var x1 = 0.0, x2 = 0.0, y1 = 0.0, y2 = 0.0
        for i in 0..<input.count {
            let x = Double(input[i])
            let y = (b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0
            x2 = x1; x1 = x; y2 = y1; y1 = y
            d[i] = Float(y)
        }
        return d
    }

    static func sine(_ hz: Double, _ i: Int, _ rate: Double) -> Double {
        sin(2 * Double.pi * hz * Double(i) / rate)
    }

    // MARK: The four sounds

    static func raw(_ sound: Sound, rate: Int, n: Int) -> [Float] {
        let r = Double(rate)
        switch sound {
        case .brown:
            var rand = Random(1); return brown(&rand, n)
        case .pink:
            var rand = Random(2); return pink(&rand, n)
        case .ocean:
            return ocean(rate: r, n: n)
        case .rain:
            return rain(rate: r, n: n)
        }
    }

    /// Waves on a beach: each wave lasts 9–14 s, builds, breaks and washes out.
    static func ocean(rate: Double, n: Int) -> [Float] {
        var rand = Random(3)
        func r01() -> Double { (rand.next() + 1) / 2 }
        let period = loopSecs * Int(rate)

        var lens: [Double] = []
        var total = 0.0
        while total < Double(loopSecs) - 9 { let l = 9 + r01() * 5; lens.append(l); total += l }
        var wave = [Float](repeating: 0, count: period)
        var pos = 0
        for (k, l) in lens.enumerated() {
            let size = k == lens.count - 1 ? period - pos : Int((l / total * Double(period)).rounded(.toNearestOrAwayFromZero))
            let peak = 0.4 + r01() * 0.15
            let strength = 0.65 + r01() * 0.35
            for j in 0..<size {
                let t = Double(j) / Double(size)
                let e = t < peak ? pow(t / peak, 2) : exp(-(t - peak) / ((1 - peak) * 0.3))
                wave[pos + j] = Float(e * strength)
            }
            pos += size
        }
        // Smooth the joins between waves (about 0.3 s)
        let smooth = exp(-1 / (0.3 * rate))
        var s = Double(wave[period - 1])
        for _ in 0..<2 {
            for i in 0..<period {
                s = s * smooth + Double(wave[i]) * (1 - smooth)
                wave[i] = Float(s)
            }
        }

        var r8 = Random(8), r9 = Random(9), r10 = Random(10)
        let body = pink(&r8, n)
        let rumble = biquad(brown(&r9, n), rate, .lowpass, 120, 0)
        let foam = biquad(white(&r10, n), rate, .highpass, 3000, 0)
        var d = [Float](repeating: 0, count: n)
        var y = 0.0, a = 0.0
        for i in 0..<n {
            let e = Double(wave[i % period])
            if i % 32 == 0 { a = exp(-2 * Double.pi * (250 + 4500 * pow(e, 1.5)) / rate) }
            y = (1 - a) * Double(body[i]) + a * y
            d[i] = Float(y * (0.25 + 1.6 * e) + Double(foam[i]) * 0.18 * e * e + Double(rumble[i]) * (0.35 + 0.25 * e))
        }
        return d
    }

    /// A steady wash, a low rumble, and drop texture that swells, patters and spikes.
    static func rain(rate: Double, n: Int) -> [Float] {
        var r4 = Random(4), r5 = Random(5), r6 = Random(6)
        let body = biquad(white(&r4, n), rate, .bandpass, 1500, 2.0)
        let rumble = biquad(brown(&r5, n), rate, .lowpass, 150, 0.5)
        let drops = biquad(pink(&r6, n), rate, .highpass, 2500, 0.7)
        var rand = Random(7)
        var d = [Float](repeating: 0, count: n)
        var spike = 0.0
        for i in 0..<n {
            if (rand.next() + 1) / 2 < 0.00003 { spike = (rand.next() + 1) / 2 * 0.15 }
            spike *= 0.9997
            let dropGain = 0.30 + 0.06 * sine(0.2, i, rate) + 0.04 * sine(2, i, rate) + spike
            d[i] = Float(Double(body[i]) * 0.50 + Double(rumble[i]) * 0.20 + Double(drops[i]) * dropGain)
        }
        return d
    }

    // MARK: The loop

    /// The website's old AAC files cut the very top; this matches that roll-off.
    static let topHz = 20000.0
    static func softTop(_ d: [Float], rate: Double) -> [Float] {
        rate / 2 <= topHz ? d : biquad(d, rate, .lowpass, topHz, -3.01)
    }

    /// One loop of a sound, levelled, whose end runs smoothly into its start:
    /// one extra second is made and crossfaded (equal power) over the first second.
    static func makeLoop(_ sound: Sound, rate: Int) -> [Float] {
        let n = loopSecs * rate
        let f = rate
        let raw = softTop(raw(sound, rate: rate, n: n + f), rate: Double(rate))
        let gain = pow(10, gainDB[sound]! / 20)
        var out = [Float](repeating: 0, count: n)
        for i in 0..<n {
            var v: Double
            if i < f {
                let x = Double.pi / 2 * Double(i) / Double(f)
                v = Double(raw[i]) * sin(x) + Double(raw[n + i]) * cos(x)
            } else {
                v = Double(raw[i])
            }
            out[i] = Float(Double(Float(v)) * gain)
        }
        return out
    }
}
