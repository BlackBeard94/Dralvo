export type ForexStrategyLibraryItem = {
  id: string;
  sourceIndex: string;
  name: string;
  category: string;
  badge: string;
  description: string;
  prompt: string;
};

export const FOREX_STRATEGY_LIBRARY = [
  {
    "id": "2-1-market-structure-trend-following",
    "sourceIndex": "2.1",
    "name": "Market Structure Trend Following",
    "category": "TREND FOLLOWING — ĐI THEO XU HƯỚNG",
    "badge": "Trend",
    "description": "Xu hướng tăng được định nghĩa bằng chuỗi Higher High + Higher Low; xu hướng giảm là Lower Low + Lower High. Chỉ giao dịch cùng phía cấu trúc.",
    "prompt": "Strategy: Market Structure Trend Following. Core idea: Xu hướng tăng được định nghĩa bằng chuỗi Higher High + Higher Low; xu hướng giảm là Lower Low + Lower High. Chỉ giao dịch cùng phía cấu trúc.. Market regime: Thị trường có cấu trúc rõ trên H1, H4 hoặc D1.. Entry rules: Buy: cấu trúc tăng; giá pullback về vùng HL / demand / EMA; xuất hiện nến xác nhận tăng. Sell: cấu trúc giảm; giá hồi về LH / supply / EMA; xuất hiện nến xác nhận giảm. Exit and risk rules: SL dưới HL gần nhất khi Buy; trên LH gần nhất khi Sell. TP tại swing high/low tiếp theo, RR cố định hoặc trailing theo structure. Common variants: BOS + pullback. CHoCH rồi BOS. HH-HL với Fibonacci 50–61.8%. Use fixed fractional risk 1% per trade. If stop or target is not explicit, use stop 1.5 ATR and target 3 ATR."
  },
  {
    "id": "2-2-moving-average-crossover",
    "sourceIndex": "2.2",
    "name": "Moving Average Crossover",
    "category": "TREND FOLLOWING — ĐI THEO XU HƯỚNG",
    "badge": "Trend",
    "description": "Vào lệnh khi MA nhanh cắt MA chậm, kỳ vọng động lượng mới.",
    "prompt": "Strategy: Moving Average Crossover. Core idea: Vào lệnh khi MA nhanh cắt MA chậm, kỳ vọng động lượng mới.. Common setup: EMA 9/21. EMA 20/50. EMA 50/200. Entry rules: Buy khi MA nhanh cắt lên MA chậm, tốt hơn khi cả hai dốc lên. Sell khi MA nhanh cắt xuống MA chậm, tốt hơn khi cả hai dốc xuống. Exit and risk rules: Cắt ngược. SL theo ATR hoặc swing. TP cố định 1.5R–3R hoặc trailing MA chậm. Common variants: Crossover + ADX > ngưỡng. Crossover + giá nằm cùng phía EMA 200. Crossover + volume/tick-volume filter. Use fixed fractional risk 1% per trade. If stop or target is not explicit, use stop 1.5 ATR and target 3 ATR."
  },
  {
    "id": "2-3-ema-pullback-dynamic-support-resistance",
    "sourceIndex": "2.3",
    "name": "EMA Pullback / Dynamic Support-Resistance",
    "category": "TREND FOLLOWING — ĐI THEO XU HƯỚNG",
    "badge": "Trend",
    "description": "Trong trend, giá thường hồi về EMA rồi tiếp diễn.",
    "prompt": "Strategy: EMA Pullback / Dynamic Support-Resistance. Core idea: Trong trend, giá thường hồi về EMA rồi tiếp diễn.. Common setup: EMA 9/21 cho scalping. EMA 20/50 cho intraday. EMA 50/200 cho swing. Entry rules: Buy: EMA dốc lên; giá hồi về EMA; nến đóng tăng trở lại. Sell: EMA dốc xuống; giá hồi về EMA; nến đóng giảm trở lại. Exit and risk rules: SL phía bên kia EMA hoặc dưới swing. TP tại đỉnh/đáy cũ, 2R, hoặc trailing theo EMA. Common variants: First pullback sau breakout. Multiple pullback. EMA + RSI > 50 / < 50. Use fixed fractional risk 1% per trade. If stop or target is not explicit, use stop 1.5 ATR and target 3 ATR."
  },
  {
    "id": "2-4-donchian-turtle-breakout-trend-following",
    "sourceIndex": "2.4",
    "name": "Donchian / Turtle Breakout Trend Following",
    "category": "TREND FOLLOWING — ĐI THEO XU HƯỚNG",
    "badge": "Trend",
    "description": "Mua khi giá phá mức cao N phiên; bán khi phá mức thấp N phiên.",
    "prompt": "Strategy: Donchian / Turtle Breakout Trend Following. Core idea: Mua khi giá phá mức cao N phiên; bán khi phá mức thấp N phiên.. Common setup: Entry: Donchian 20. Exit: Donchian 10. Stop: 2 ATR. Entry rules: Buy khi phá high của N nến. Sell khi phá low của N nến. Exit and risk rules: Thoát khi phá channel ngược ngắn hơn. ATR trailing. Exit theo MA / time stop. Common variants: 20/10 Turtle. 55/20 dài hạn. Donchian + ADX. Use fixed fractional risk 1% per trade. If stop or target is not explicit, use stop 1.5 ATR and target 3 ATR."
  },
  {
    "id": "2-5-supertrend-strategy",
    "sourceIndex": "2.5",
    "name": "Supertrend Strategy",
    "category": "TREND FOLLOWING — ĐI THEO XU HƯỚNG",
    "badge": "Trend",
    "description": "Dùng ATR để tạo đường trailing động; tín hiệu đổi màu/đổi phía đại diện cho chuyển trend.",
    "prompt": "Strategy: Supertrend Strategy. Core idea: Dùng ATR để tạo đường trailing động; tín hiệu đổi màu/đổi phía đại diện cho chuyển trend.. Entry rules: Buy khi giá đóng trên Supertrend và đường chuyển bullish. Sell khi giá đóng dưới Supertrend và đường chuyển bearish. Exit and risk rules: SL/trailing theo Supertrend. Hoặc TP cố định + dời SL hòa vốn. Common variants: Supertrend 10,3. Supertrend + EMA 200 filter. Dual Supertrend. Use fixed fractional risk 1% per trade. If stop or target is not explicit, use stop 1.5 ATR and target 3 ATR."
  },
  {
    "id": "2-6-ichimoku-trend-strategy",
    "sourceIndex": "2.6",
    "name": "Ichimoku Trend Strategy",
    "category": "TREND FOLLOWING — ĐI THEO XU HƯỚNG",
    "badge": "Trend",
    "description": "Mây Ichimoku kết hợp trend, momentum và vùng hỗ trợ/kháng cự động.",
    "prompt": "Strategy: Ichimoku Trend Strategy. Core idea: Mây Ichimoku kết hợp trend, momentum và vùng hỗ trợ/kháng cự động.. Entry rules: Buy mạnh: giá trên mây, Tenkan cắt lên Kijun, Chikou xác nhận. Sell mạnh: giá dưới mây, Tenkan cắt xuống Kijun, Chikou xác nhận. Exit and risk rules: Kijun-sen, biên mây hoặc ATR. Exit khi giá chui ngược vào mây. Common variants: Kumo breakout. Tenkan-Kijun cross. Kijun pullback. Use fixed fractional risk 1% per trade. If stop or target is not explicit, use stop 1.5 ATR and target 3 ATR."
  },
  {
    "id": "2-7-adx-dmi-trend-strategy",
    "sourceIndex": "2.7",
    "name": "ADX / DMI Trend Strategy",
    "category": "TREND FOLLOWING — ĐI THEO XU HƯỚNG",
    "badge": "Trend",
    "description": "ADX đo độ mạnh xu hướng; +DI/-DI xác nhận hướng.",
    "prompt": "Strategy: ADX / DMI Trend Strategy. Core idea: ADX đo độ mạnh xu hướng; +DI/-DI xác nhận hướng.. Entry rules: Buy: +DI > -DI và ADX tăng vượt ngưỡng. Sell: -DI > +DI và ADX tăng vượt ngưỡng. Exit and risk rules: DI cắt ngược. ADX suy yếu mạnh. SL ATR/swing. Common variants: ADX > 20, 25 hoặc 30. ADX rising filter cho breakout. ADX + EMA. Use fixed fractional risk 1% per trade. If stop or target is not explicit, use stop 1.5 ATR and target 3 ATR."
  },
  {
    "id": "2-8-momentum-continuation",
    "sourceIndex": "2.8",
    "name": "Momentum Continuation",
    "category": "TREND FOLLOWING — ĐI THEO XU HƯỚNG",
    "badge": "Trend",
    "description": "Sau một impulse mạnh, giá hồi nông rồi tiếp diễn.",
    "prompt": "Strategy: Momentum Continuation. Core idea: Sau một impulse mạnh, giá hồi nông rồi tiếp diễn.. Entry rules: Xác định impulse: range nến lớn hơn ATR, phá cấu trúc. Chờ pullback nông về 38.2–50%, EMA hoặc FVG. Vào theo hướng impulse khi có nến xác nhận. Exit and risk rules: SL sau đáy/đỉnh pullback. TP theo measured move, extension hoặc trailing. Common variants: Flag continuation. Pennant continuation. Momentum candle + inside bar. Use fixed fractional risk 1% per trade. If stop or target is not explicit, use stop 1.5 ATR and target 3 ATR."
  },
  {
    "id": "3-1-fibonacci-pullback",
    "sourceIndex": "3.1",
    "name": "Fibonacci Pullback",
    "category": "PULLBACK, RETRACEMENT VÀ CONTINUATION PATTERN",
    "badge": "Strategy",
    "description": "Trong trend, các vùng retracement 38.2%, 50%, 61.8%, 78.6% có thể đóng vai trò vùng quan sát phản ứng giá.",
    "prompt": "Strategy: Fibonacci Pullback. Core idea: Trong trend, các vùng retracement 38.2%, 50%, 61.8%, 78.6% có thể đóng vai trò vùng quan sát phản ứng giá.. Entry rules: Xác định swing impulse đúng chiều trend. Kẻ Fibonacci từ swing low đến swing high trong trend tăng, ngược lại trong trend giảm. Chờ phản ứng tại vùng 50–61.8% hoặc vùng có confluence. Exit and risk rules: SL qua swing / dưới 78.6% tùy rule. TP tại đỉnh/đáy cũ, extension 127.2%/161.8%, hoặc RR cố định. Common variants: Golden zone 50–61.8%. 38.2% shallow pullback. 78.6% deep pullback. Use fixed fractional risk 1% per trade. If stop or target is not explicit, use stop 1.5 ATR and target 3 ATR."
  },
  {
    "id": "3-2-flag-va-pennant-continuation",
    "sourceIndex": "3.2",
    "name": "Flag và Pennant Continuation",
    "category": "PULLBACK, RETRACEMENT VÀ CONTINUATION PATTERN",
    "badge": "Strategy",
    "description": "Sau một cú đẩy mạnh, giá tích lũy ngắn hạn rồi phá tiếp cùng chiều trước đó.",
    "prompt": "Strategy: Flag và Pennant Continuation. Core idea: Sau một cú đẩy mạnh, giá tích lũy ngắn hạn rồi phá tiếp cùng chiều trước đó.. Entry rules: Có flagpole/impulse rõ. Giá tạo kênh hồi ngược nhẹ (flag) hoặc tam giác co hẹp (pennant). Vào khi phá cạnh theo chiều impulse, ưu tiên retest. Exit and risk rules: SL phía đối diện mô hình. TP theo chiều dài flagpole hoặc 1.5–3R. Common variants: Bull flag. Bear flag. High-tight flag. Use fixed fractional risk 1% per trade. If stop or target is not explicit, use stop 1.5 ATR and target 3 ATR."
  },
  {
    "id": "3-3-triangle-wedge-continuation",
    "sourceIndex": "3.3",
    "name": "Triangle / Wedge Continuation",
    "category": "PULLBACK, RETRACEMENT VÀ CONTINUATION PATTERN",
    "badge": "Strategy",
    "description": "Volatility co lại trong vùng tam giác hoặc wedge, kỳ vọng mở rộng biến động khi phá vỡ.",
    "prompt": "Strategy: Triangle / Wedge Continuation. Core idea: Volatility co lại trong vùng tam giác hoặc wedge, kỳ vọng mở rộng biến động khi phá vỡ.. Entry rules: Chờ nến đóng phá biên. Tốt hơn: breakout + retest + continuation candle. Exit and risk rules: SL sau biên đối diện hoặc swing. TP theo chiều cao đáy mô hình. Use fixed fractional risk 1% per trade. If stop or target is not explicit, use stop 1.5 ATR and target 3 ATR."
  },
  {
    "id": "4-1-horizontal-support-resistance-range",
    "sourceIndex": "4.1",
    "name": "Horizontal Support/Resistance Range",
    "category": "RANGE TRADING — GIAO DỊCH SIDEWAY",
    "badge": "Mean reversion",
    "description": "Mua ở biên dưới range, bán ở biên trên range, kỳ vọng giá quay về trung tâm hoặc biên đối diện.",
    "prompt": "Strategy: Horizontal Support/Resistance Range. Core idea: Mua ở biên dưới range, bán ở biên trên range, kỳ vọng giá quay về trung tâm hoặc biên đối diện.. Entry rules: Xác nhận ít nhất 2–3 lần chạm mỗi biên. Buy gần support với nến từ chối giảm. Sell gần resistance với nến từ chối tăng. Exit and risk rules: TP giữa range hoặc biên đối diện. SL nằm ngoài biên range + buffer ATR. Common variants: Range 2-touch. Range 3-touch. Session range. Use fixed fractional risk 1% per trade. If stop or target is not explicit, use stop 1.5 ATR and target 3 ATR."
  },
  {
    "id": "4-2-bollinger-band-mean-reversion",
    "sourceIndex": "4.2",
    "name": "Bollinger Band Mean Reversion",
    "category": "RANGE TRADING — GIAO DỊCH SIDEWAY",
    "badge": "Mean reversion",
    "description": "Giá chạm/đi ra ngoài band trong thị trường không trend có thể quay về middle band.",
    "prompt": "Strategy: Bollinger Band Mean Reversion. Core idea: Giá chạm/đi ra ngoài band trong thị trường không trend có thể quay về middle band.. Common setup: SMA 20, 2 độ lệch chuẩn. Thêm RSI 14. Entry rules: Buy: giá chạm/đóng dưới lower band + tín hiệu từ chối + không có trend giảm mạnh. Sell: giá chạm/đóng trên upper band + tín hiệu từ chối + không có trend tăng mạnh. Exit and risk rules: TP middle band; mạnh hơn có thể tới band đối diện. SL ngoài swing / ATR. Common variants: BB + RSI <30 / >70. BB + Stochastic. Double Bollinger Bands. Use fixed fractional risk 1% per trade. If stop or target is not explicit, use stop 1.5 ATR and target 3 ATR."
  },
  {
    "id": "4-3-pivot-point-reversal",
    "sourceIndex": "4.3",
    "name": "Pivot Point Reversal",
    "category": "RANGE TRADING — GIAO DỊCH SIDEWAY",
    "badge": "Mean reversion",
    "description": "Pivot hàng ngày/tuần tạo các mốc PP, S1/S2/S3 và R1/R2/R3 để tìm vùng phản ứng.",
    "prompt": "Strategy: Pivot Point Reversal. Core idea: Pivot hàng ngày/tuần tạo các mốc PP, S1/S2/S3 và R1/R2/R3 để tìm vùng phản ứng.. Entry rules: Buy tại S1/S2 khi có rejection và market không trend giảm mạnh. Sell tại R1/R2 khi có rejection và market không trend tăng mạnh. Exit and risk rules: TP PP hoặc level pivot tiếp theo. SL qua level + buffer. Common variants: Standard pivot. Fibonacci pivot. Camarilla pivot. Use fixed fractional risk 1% per trade. If stop or target is not explicit, use stop 1.5 ATR and target 3 ATR."
  },
  {
    "id": "4-4-vwap-mean-reversion",
    "sourceIndex": "4.4",
    "name": "VWAP Mean Reversion",
    "category": "RANGE TRADING — GIAO DỊCH SIDEWAY",
    "badge": "Mean reversion",
    "description": "Giá lệch quá xa khỏi VWAP trong phiên có thể hồi về giá trung bình có trọng số theo volume.",
    "prompt": "Strategy: VWAP Mean Reversion. Core idea: Giá lệch quá xa khỏi VWAP trong phiên có thể hồi về giá trung bình có trọng số theo volume.. Entry rules: Xác định giá lệch đáng kể khỏi VWAP / deviation bands. Chờ tín hiệu exhaustion hoặc cấu trúc đảo chiều nhỏ. Ưu tiên phiên thanh khoản cao. Exit and risk rules: TP VWAP hoặc deviation band đối diện. SL qua extreme. Common variants: Session VWAP. Anchored VWAP. VWAP deviation bands. Use fixed fractional risk 1% per trade. If stop or target is not explicit, use stop 1.5 ATR and target 3 ATR."
  },
  {
    "id": "5-1-support-resistance-breakout",
    "sourceIndex": "5.1",
    "name": "Support/Resistance Breakout",
    "category": "BREAKOUT TRADING — PHÁ VỠ VÙNG GIÁ",
    "badge": "Breakout",
    "description": "Khi giá vượt qua vùng cung/cầu mạnh, kỳ vọng dòng lệnh mới kéo giá đi tiếp.",
    "prompt": "Strategy: Support/Resistance Breakout. Core idea: Khi giá vượt qua vùng cung/cầu mạnh, kỳ vọng dòng lệnh mới kéo giá đi tiếp.. Entry rules: Nến đóng vượt level; không chỉ wick. Ưu tiên breakout cùng trend lớn, ATR/tick volume tăng. Có thể vào ngay hoặc chờ retest. Exit and risk rules: SL dưới/ trên level breakout. TP theo next structure, measured move, ATR multiple hoặc trailing. Common variants: Close breakout. Retest breakout. 2-candle confirmation. Use fixed fractional risk 1% per trade. If stop or target is not explicit, use stop 1.5 ATR and target 3 ATR."
  },
  {
    "id": "5-2-opening-range-breakout-orb",
    "sourceIndex": "5.2",
    "name": "Opening Range Breakout (ORB)",
    "category": "BREAKOUT TRADING — PHÁ VỠ VÙNG GIÁ",
    "badge": "Mean reversion",
    "description": "Lấy high/low của một khoảng thời gian mở phiên, giao dịch khi giá phá range đó.",
    "prompt": "Strategy: Opening Range Breakout (ORB). Core idea: Lấy high/low của một khoảng thời gian mở phiên, giao dịch khi giá phá range đó.. Entry rules: Buy khi phá OR high. Sell khi phá OR low. Có thể chỉ trade phía cùng với bias H1/H4. Exit and risk rules: SL phía trong range. TP 1–2 lần chiều rộng range hoặc RR cố định. Time stop cuối phiên. Common variants: London ORB. New York ORB. Asian range breakout. Use fixed fractional risk 1% per trade. If stop or target is not explicit, use stop 1.5 ATR and target 3 ATR."
  },
  {
    "id": "5-3-bollinger-squeeze-volatility-expansion",
    "sourceIndex": "5.3",
    "name": "Bollinger Squeeze / Volatility Expansion",
    "category": "BREAKOUT TRADING — PHÁ VỠ VÙNG GIÁ",
    "badge": "Breakout",
    "description": "Khi Bollinger Bands co hẹp, thị trường đang nén volatility; break khỏi vùng nén có thể dẫn tới expansion.",
    "prompt": "Strategy: Bollinger Squeeze / Volatility Expansion. Core idea: Khi Bollinger Bands co hẹp, thị trường đang nén volatility; break khỏi vùng nén có thể dẫn tới expansion.. Entry rules: Bandwidth giảm xuống percentile thấp. Giá break range/nến đóng ra khỏi band. Xác nhận bằng ATR hoặc volume tăng. Exit and risk rules: SL vào lại vùng squeeze. TP theo ATR hoặc trailing. Common variants: BB squeeze. TTM Squeeze (BB + Keltner). Keltner squeeze. Use fixed fractional risk 1% per trade. If stop or target is not explicit, use stop 1.5 ATR and target 3 ATR."
  },
  {
    "id": "5-4-previous-day-high-low-breakout",
    "sourceIndex": "5.4",
    "name": "Previous Day High/Low Breakout",
    "category": "BREAKOUT TRADING — PHÁ VỠ VÙNG GIÁ",
    "badge": "Breakout",
    "description": "PDH/PDL là các mốc quan sát phổ biến trong intraday FX.",
    "prompt": "Strategy: Previous Day High/Low Breakout. Core idea: PDH/PDL là các mốc quan sát phổ biến trong intraday FX.. Entry rules: Break + close qua PDH/PDL. Hoặc quét thanh khoản rồi reclaim level. Chọn hướng theo bias higher timeframe. Exit and risk rules: SL phía bên kia level/swing. TP daily range extension, next weekly level hoặc ATR. Common variants: PDH/PDL breakout. Sweep-and-go. Sweep-and-reverse. Use fixed fractional risk 1% per trade. If stop or target is not explicit, use stop 1.5 ATR and target 3 ATR."
  },
  {
    "id": "6-1-pin-bar-hammer-shooting-star",
    "sourceIndex": "6.1",
    "name": "Pin Bar / Hammer / Shooting Star",
    "category": "PRICE ACTION VÀ CANDLESTICK STRATEGIES",
    "badge": "Strategy",
    "description": "Râu nến dài thể hiện giá bị từ chối tại một vùng.",
    "prompt": "Strategy: Pin Bar / Hammer / Shooting Star. Core idea: Râu nến dài thể hiện giá bị từ chối tại một vùng.. Entry rules: Buy: hammer/pin bar bullish tại support hoặc pullback trong uptrend. Sell: shooting star/pin bar bearish tại resistance hoặc pullback trong downtrend. Vào khi break high/low pin bar hoặc close xác nhận. Exit and risk rules: SL qua râu nến. TP tới structure tiếp theo hoặc 2R. Common variants: Pin bar at key level. Pin bar + Fibonacci. Pin bar + EMA. Use fixed fractional risk 1% per trade. If stop or target is not explicit, use stop 1.5 ATR and target 3 ATR."
  },
  {
    "id": "6-2-engulfing-strategy",
    "sourceIndex": "6.2",
    "name": "Engulfing Strategy",
    "category": "PRICE ACTION VÀ CANDLESTICK STRATEGIES",
    "badge": "Strategy",
    "description": "Nến engulfing thể hiện lực bên mua/bán áp đảo nến trước.",
    "prompt": "Strategy: Engulfing Strategy. Core idea: Nến engulfing thể hiện lực bên mua/bán áp đảo nến trước.. Entry rules: Bullish engulfing tại demand/support hoặc pullback trong uptrend. Bearish engulfing tại supply/resistance hoặc pullback trong downtrend. Exit and risk rules: SL sau extreme của pattern. TP tại swing hoặc RR cố định. Common variants: Engulfing + RSI divergence. Engulfing + order block. Engulfing + EMA 50. Use fixed fractional risk 1% per trade. If stop or target is not explicit, use stop 1.5 ATR and target 3 ATR."
  },
  {
    "id": "6-3-inside-bar-fakey",
    "sourceIndex": "6.3",
    "name": "Inside Bar / Fakey",
    "category": "PRICE ACTION VÀ CANDLESTICK STRATEGIES",
    "badge": "Strategy",
    "description": "Inside bar là nến nằm trong phạm vi nến mẹ, biểu thị nén giá; fakey là break giả rồi đảo chiều.",
    "prompt": "Strategy: Inside Bar / Fakey. Core idea: Inside bar là nến nằm trong phạm vi nến mẹ, biểu thị nén giá; fakey là break giả rồi đảo chiều.. Entry rules: Break high mother bar = Buy. Break low mother bar = Sell. Fakey: phá một phía rồi đóng quay lại range, vào ngược hướng break giả. Exit and risk rules: SL phía đối diện mother bar. TP theo range/ATR/structure. Common variants: Inside bar trend continuation. Inside bar at key level. Double inside bar. Use fixed fractional risk 1% per trade. If stop or target is not explicit, use stop 1.5 ATR and target 3 ATR."
  },
  {
    "id": "6-4-morning-evening-star-doji-harami-tweezer",
    "sourceIndex": "6.4",
    "name": "Morning/Evening Star, Doji, Harami, Tweezer",
    "category": "PRICE ACTION VÀ CANDLESTICK STRATEGIES",
    "badge": "Strategy",
    "description": "Các cụm nến đảo chiều ngắn hạn tại vùng giá quan trọng.",
    "prompt": "Strategy: Morning/Evening Star, Doji, Harami, Tweezer. Core idea: Các cụm nến đảo chiều ngắn hạn tại vùng giá quan trọng.. Entry rules: Chỉ dùng khi pattern nằm ở support/resistance, fib, pivot hoặc vùng exhaustion. Vào sau nến xác nhận đóng theo hướng đảo chiều. Exit and risk rules: SL qua extreme pattern. TP tại vùng cân bằng / structure tiếp theo. Common variants: Morning star. Evening star. Doji reversal. Use fixed fractional risk 1% per trade. If stop or target is not explicit, use stop 1.5 ATR and target 3 ATR."
  },
  {
    "id": "7-1-rsi-overbought-oversold",
    "sourceIndex": "7.1",
    "name": "RSI Overbought/Oversold",
    "category": "MEAN REVERSION VÀ OSCILLATOR STRATEGIES",
    "badge": "Mean reversion",
    "description": "RSI cực trị có thể cho thấy động lượng ngắn hạn bị kéo quá xa.",
    "prompt": "Strategy: RSI Overbought/Oversold. Core idea: RSI cực trị có thể cho thấy động lượng ngắn hạn bị kéo quá xa.. Entry rules: Buy: RSI dưới 30 rồi quay lại trên 30, đồng thời có support/rejection. Sell: RSI trên 70 rồi quay lại dưới 70, đồng thời có resistance/rejection. Exit and risk rules: TP RSI 50, middle BB, hoặc biên range đối diện. SL sau extreme. Common variants: RSI 30/70. RSI 20/80. RSI 40/60 trend regime. Use fixed fractional risk 1% per trade. If stop or target is not explicit, use stop 1.5 ATR and target 3 ATR."
  },
  {
    "id": "7-2-rsi-macd-divergence",
    "sourceIndex": "7.2",
    "name": "RSI / MACD Divergence",
    "category": "MEAN REVERSION VÀ OSCILLATOR STRATEGIES",
    "badge": "Mean reversion",
    "description": "Giá tạo high/low mới nhưng oscillator không xác nhận, gợi ý động lượng suy yếu.",
    "prompt": "Strategy: RSI / MACD Divergence. Core idea: Giá tạo high/low mới nhưng oscillator không xác nhận, gợi ý động lượng suy yếu.. Entry rules: Bullish divergence: giá lower low, oscillator higher low; chờ breakout cấu trúc nhỏ. Bearish divergence: giá higher high, oscillator lower high; chờ breakdown cấu trúc nhỏ. Exit and risk rules: SL qua price extreme. TP tại vùng cân bằng hoặc swing đối diện. Common variants: Regular divergence. Hidden divergence (continuation). RSI divergence. Use fixed fractional risk 1% per trade. If stop or target is not explicit, use stop 1.5 ATR and target 3 ATR."
  },
  {
    "id": "7-3-stochastic-reversal",
    "sourceIndex": "7.3",
    "name": "Stochastic Reversal",
    "category": "MEAN REVERSION VÀ OSCILLATOR STRATEGIES",
    "badge": "Mean reversion",
    "description": "Stochastic đo vị trí close trong range gần đây, thường dùng để tìm hồi giá trong sideway.",
    "prompt": "Strategy: Stochastic Reversal. Core idea: Stochastic đo vị trí close trong range gần đây, thường dùng để tìm hồi giá trong sideway.. Entry rules: Buy: %K/%D cắt lên trong vùng oversold + support. Sell: %K/%D cắt xuống trong vùng overbought + resistance. Exit and risk rules: Middle range, biên đối diện hoặc RR. SL sau swing. Common variants: Stochastic 14,3,3. Fast/slow stochastic. Stochastic divergence. Use fixed fractional risk 1% per trade. If stop or target is not explicit, use stop 1.5 ATR and target 3 ATR."
  },
  {
    "id": "7-4-cci-williams-r-mfi-roc",
    "sourceIndex": "7.4",
    "name": "CCI, Williams %R, MFI, ROC",
    "category": "MEAN REVERSION VÀ OSCILLATOR STRATEGIES",
    "badge": "Mean reversion",
    "description": "Các oscillator khác nhằm đo mức độ quá mua/quá bán hoặc tốc độ thay đổi.",
    "prompt": "Strategy: CCI, Williams %R, MFI, ROC. Core idea: Các oscillator khác nhằm đo mức độ quá mua/quá bán hoặc tốc độ thay đổi.. Common variants: CCI zero-line cross. CCI divergence. Williams %R range reversal. Use fixed fractional risk 1% per trade. If stop or target is not explicit, use stop 1.5 ATR and target 3 ATR."
  },
  {
    "id": "8-1-liquidity-sweep-stop-hunt",
    "sourceIndex": "8.1",
    "name": "Liquidity Sweep / Stop Hunt",
    "category": "SMART MONEY CONCEPTS / ICT / LIQUIDITY-BASED",
    "badge": "SMC/ICT",
    "description": "Giá quét qua equal highs/equal lows hoặc swing nổi bật rồi quay lại range, nhằm tìm reversal hoặc continuation.",
    "prompt": "Strategy: Liquidity Sweep / Stop Hunt. Core idea: Giá quét qua equal highs/equal lows hoặc swing nổi bật rồi quay lại range, nhằm tìm reversal hoặc continuation.. Entry rules: Giá wick/break qua liquidity pool. Đóng quay lại phía trong range. Có CHoCH/BOS nhỏ theo hướng đảo chiều. Exit and risk rules: SL ngoài extreme sweep. TP tại liquidity pool đối diện / FVG / structure. Common variants: PDH/PDL sweep. Asian high/low sweep. Equal highs/lows sweep. Use fixed fractional risk 1% per trade. If stop or target is not explicit, use stop 1.5 ATR and target 3 ATR."
  },
  {
    "id": "8-2-break-of-structure-bos-change-of-character-choch",
    "sourceIndex": "8.2",
    "name": "Break of Structure (BOS) / Change of Character (CHoCH)",
    "category": "SMART MONEY CONCEPTS / ICT / LIQUIDITY-BASED",
    "badge": "SMC/ICT",
    "description": "BOS xác nhận continuation cấu trúc; CHoCH/MSS cảnh báo thay đổi hướng ngắn hạn.",
    "prompt": "Strategy: Break of Structure (BOS) / Change of Character (CHoCH). Core idea: BOS xác nhận continuation cấu trúc; CHoCH/MSS cảnh báo thay đổi hướng ngắn hạn.. Entry rules: Continuation: BOS cùng trend rồi pullback. Reversal: liquidity sweep → CHoCH → pullback entry. Exit and risk rules: SL qua swing của pullback. TP tại external liquidity / structure target. Common variants: Internal structure. External structure. BOS + order block. Use fixed fractional risk 1% per trade. If stop or target is not explicit, use stop 1.5 ATR and target 3 ATR."
  },
  {
    "id": "8-3-order-block-breaker-mitigation-block",
    "sourceIndex": "8.3",
    "name": "Order Block / Breaker / Mitigation Block",
    "category": "SMART MONEY CONCEPTS / ICT / LIQUIDITY-BASED",
    "badge": "SMC/ICT",
    "description": "Định vị cây nến hoặc cụm nến cuối cùng trước một displacement mạnh, xem như vùng phản ứng tiềm năng.",
    "prompt": "Strategy: Order Block / Breaker / Mitigation Block. Core idea: Định vị cây nến hoặc cụm nến cuối cùng trước một displacement mạnh, xem như vùng phản ứng tiềm năng.. Entry rules: Có displacement và BOS. Giá hồi về order block. Vào với confirmation hoặc limit order tùy rule. Exit and risk rules: SL qua vùng order block. TP liquidity/structure tiếp theo. Common variants: Bullish/bearish OB. Refined OB. Breaker block. Use fixed fractional risk 1% per trade. If stop or target is not explicit, use stop 1.5 ATR and target 3 ATR."
  },
  {
    "id": "8-4-fair-value-gap-fvg-imbalance",
    "sourceIndex": "8.4",
    "name": "Fair Value Gap (FVG) / Imbalance",
    "category": "SMART MONEY CONCEPTS / ICT / LIQUIDITY-BASED",
    "badge": "SMC/ICT",
    "description": "Khoảng mất cân bằng ba nến sau displacement; giá có thể quay về fill một phần/toàn phần trước khi tiếp diễn.",
    "prompt": "Strategy: Fair Value Gap (FVG) / Imbalance. Core idea: Khoảng mất cân bằng ba nến sau displacement; giá có thể quay về fill một phần/toàn phần trước khi tiếp diễn.. Entry rules: Có trend / BOS rõ. Giá hồi về FVG cùng chiều trend. Chờ confirmation hoặc entry tại 50% FVG. Exit and risk rules: SL qua FVG/swing. TP đến liquidity/đỉnh đáy mới. Common variants: Full fill. 50% fill. Inverse FVG. Use fixed fractional risk 1% per trade. If stop or target is not explicit, use stop 1.5 ATR and target 3 ATR."
  },
  {
    "id": "8-5-premium-discount-va-ote",
    "sourceIndex": "8.5",
    "name": "Premium/Discount và OTE",
    "category": "SMART MONEY CONCEPTS / ICT / LIQUIDITY-BASED",
    "badge": "SMC/ICT",
    "description": "Chia dealing range bằng Fibonacci: vùng dưới 50% là discount cho Buy trong bullish context; trên 50% là premium cho Sell trong bearish context.",
    "prompt": "Strategy: Premium/Discount và OTE. Core idea: Chia dealing range bằng Fibonacci: vùng dưới 50% là discount cho Buy trong bullish context; trên 50% là premium cho Sell trong bearish context.. Entry rules: Bullish HTF: chỉ tìm Buy tại discount, thường 62–79%. Bearish HTF: chỉ tìm Sell tại premium, thường 62–79%. Kết hợp FVG/OB/liquidity sweep. Use fixed fractional risk 1% per trade. If stop or target is not explicit, use stop 1.5 ATR and target 3 ATR."
  },
  {
    "id": "8-6-killzones-amd-silver-bullet",
    "sourceIndex": "8.6",
    "name": "Killzones, AMD, Silver Bullet",
    "category": "SMART MONEY CONCEPTS / ICT / LIQUIDITY-BASED",
    "badge": "SMC/ICT",
    "description": "Giao dịch trong các khung giờ thanh khoản cao và dùng mô hình accumulation–manipulation–distribution hoặc sweep + displacement.",
    "prompt": "Strategy: Killzones, AMD, Silver Bullet. Core idea: Giao dịch trong các khung giờ thanh khoản cao và dùng mô hình accumulation–manipulation–distribution hoặc sweep + displacement.. Common variants: Asian range → London manipulation → London distribution. New York reversal. Silver Bullet time-window. Use fixed fractional risk 1% per trade. If stop or target is not explicit, use stop 1.5 ATR and target 3 ATR."
  },
  {
    "id": "9-1-ab-cd",
    "sourceIndex": "9.1",
    "name": "AB=CD",
    "category": "HARMONIC, ELLIOTT VÀ MÔ HÌNH HÌNH HỌC",
    "badge": "Strategy",
    "description": "Hai leg giá có độ dài/tỷ lệ tương quan; vùng hoàn thành có thể là điểm phản ứng.",
    "prompt": "Strategy: AB=CD. Core idea: Hai leg giá có độ dài/tỷ lệ tương quan; vùng hoàn thành có thể là điểm phản ứng.. Entry rules: Xác định A-B-C-D. D hoàn thành tại fib projection/confluence. Chờ nến xác nhận. Common variants: Classic AB=CD. Alternate AB=CD. Reciprocal AB=CD. Use fixed fractional risk 1% per trade. If stop or target is not explicit, use stop 1.5 ATR and target 3 ATR."
  },
  {
    "id": "9-2-gartley-bat-butterfly-crab-cypher-shark",
    "sourceIndex": "9.2",
    "name": "Gartley, Bat, Butterfly, Crab, Cypher, Shark",
    "category": "HARMONIC, ELLIOTT VÀ MÔ HÌNH HÌNH HỌC",
    "badge": "Strategy",
    "description": "Các harmonic pattern dùng tỷ lệ Fibonacci giữa nhiều swing để xác định PRZ (Potential Reversal Zone).",
    "prompt": "Strategy: Gartley, Bat, Butterfly, Crab, Cypher, Shark. Core idea: Các harmonic pattern dùng tỷ lệ Fibonacci giữa nhiều swing để xác định PRZ (Potential Reversal Zone).. Entry rules: Không vào chỉ vì pattern “gần đúng”. Chỉ quan sát tại PRZ + confirmation candle / divergence / structure shift. Exit and risk rules: SL vượt PRZ. TP theo XA retracement hoặc scale-out. Use fixed fractional risk 1% per trade. If stop or target is not explicit, use stop 1.5 ATR and target 3 ATR."
  },
  {
    "id": "9-3-elliott-wave",
    "sourceIndex": "9.3",
    "name": "Elliott Wave",
    "category": "HARMONIC, ELLIOTT VÀ MÔ HÌNH HÌNH HỌC",
    "badge": "Strategy",
    "description": "Xu hướng thường có 5 sóng đẩy và 3 sóng điều chỉnh theo cách đếm sóng.",
    "prompt": "Strategy: Elliott Wave. Core idea: Xu hướng thường có 5 sóng đẩy và 3 sóng điều chỉnh theo cách đếm sóng.. Use fixed fractional risk 1% per trade. If stop or target is not explicit, use stop 1.5 ATR and target 3 ATR."
  },
  {
    "id": "9-4-wolfe-wave",
    "sourceIndex": "9.4",
    "name": "Wolfe Wave",
    "category": "HARMONIC, ELLIOTT VÀ MÔ HÌNH HÌNH HỌC",
    "badge": "Strategy",
    "description": "Mô hình 5 điểm trong channel/wedge, target thường là đường EPA.",
    "prompt": "Strategy: Wolfe Wave. Core idea: Mô hình 5 điểm trong channel/wedge, target thường là đường EPA.. Use fixed fractional risk 1% per trade. If stop or target is not explicit, use stop 1.5 ATR and target 3 ATR."
  },
  {
    "id": "10-1-asian-range-strategy",
    "sourceIndex": "10.1",
    "name": "Asian Range Strategy",
    "category": "SESSION-BASED FOREX STRATEGIES",
    "badge": "Mean reversion",
    "description": "Asian session thường có range hẹp hơn; London/NY có thể phá range.",
    "prompt": "Strategy: Asian Range Strategy. Core idea: Asian session thường có range hẹp hơn; London/NY có thể phá range.. Use fixed fractional risk 1% per trade. If stop or target is not explicit, use stop 1.5 ATR and target 3 ATR."
  },
  {
    "id": "10-2-london-breakout",
    "sourceIndex": "10.2",
    "name": "London Breakout",
    "category": "SESSION-BASED FOREX STRATEGIES",
    "badge": "Breakout",
    "description": "Thanh khoản tăng khi London mở có thể tạo breakout khỏi range trước đó.",
    "prompt": "Strategy: London Breakout. Core idea: Thanh khoản tăng khi London mở có thể tạo breakout khỏi range trước đó.. Entry rules: Đặt trigger trên Asian high và dưới Asian low. Chỉ nhận break cùng bias hoặc có volatility filter. Có thể trade một phía duy nhất trong ngày. Use fixed fractional risk 1% per trade. If stop or target is not explicit, use stop 1.5 ATR and target 3 ATR."
  },
  {
    "id": "10-3-new-york-open-london-close-reversal",
    "sourceIndex": "10.3",
    "name": "New York Open / London Close Reversal",
    "category": "SESSION-BASED FOREX STRATEGIES",
    "badge": "Mean reversion",
    "description": "Chuyển giao thanh khoản giữa London và New York có thể tạo continuation hoặc reversal.",
    "prompt": "Strategy: New York Open / London Close Reversal. Core idea: Chuyển giao thanh khoản giữa London và New York có thể tạo continuation hoặc reversal.. Common variants: NY open breakout. NY reversal sau London extension. London close mean reversion. Use fixed fractional risk 1% per trade. If stop or target is not explicit, use stop 1.5 ATR and target 3 ATR."
  },
  {
    "id": "10-4-weekend-gap-sunday-gap",
    "sourceIndex": "10.4",
    "name": "Weekend Gap / Sunday Gap",
    "category": "SESSION-BASED FOREX STRATEGIES",
    "badge": "Session",
    "description": "Khi thị trường mở đầu tuần có gap, một số trader kỳ vọng gap được lấp.",
    "prompt": "Strategy: Weekend Gap / Sunday Gap. Core idea: Khi thị trường mở đầu tuần có gap, một số trader kỳ vọng gap được lấp.. Entry rules: Xác định gap đủ lớn sau khi market mở. Chỉ trade khi spread bình thường và không có tin lớn. Use fixed fractional risk 1% per trade. If stop or target is not explicit, use stop 1.5 ATR and target 3 ATR."
  },
  {
    "id": "11-1-central-bank-divergence",
    "sourceIndex": "11.1",
    "name": "Central Bank Divergence",
    "category": "FUNDAMENTAL, MACRO VÀ CARRY TRADE",
    "badge": "Strategy",
    "description": "Khác biệt kỳ vọng lãi suất/chính sách tiền tệ giữa hai quốc gia có thể tạo xu hướng trung-dài hạn cho cặp tiền.",
    "prompt": "Strategy: Central Bank Divergence. Core idea: Khác biệt kỳ vọng lãi suất/chính sách tiền tệ giữa hai quốc gia có thể tạo xu hướng trung-dài hạn cho cặp tiền.. Entry rules: Xây bias theo lãi suất, inflation, employment, định hướng ngân hàng trung ương. Dùng technical pullback để vào. Common variants: Hawkish vs dovish. Rate hike/cut repricing. Real yield differential. Use fixed fractional risk 1% per trade. If stop or target is not explicit, use stop 1.5 ATR and target 3 ATR."
  },
  {
    "id": "11-2-carry-trade",
    "sourceIndex": "11.2",
    "name": "Carry Trade",
    "category": "FUNDAMENTAL, MACRO VÀ CARRY TRADE",
    "badge": "Strategy",
    "description": "Mua đồng tiền lãi suất cao và bán đồng tiền lãi suất thấp để hưởng chênh lệch lãi suất/swap, đồng thời kỳ vọng tỷ giá không đi ngược mạnh.",
    "prompt": "Strategy: Carry Trade. Core idea: Mua đồng tiền lãi suất cao và bán đồng tiền lãi suất thấp để hưởng chênh lệch lãi suất/swap, đồng thời kỳ vọng tỷ giá không đi ngược mạnh.. Entry rules: Chọn cặp có chênh lệch lãi suất thuận. Ưu tiên regime risk-on và volatility ổn định. Có trend filter dài hạn. Exit and risk rules: Khi chênh lệch chính sách thu hẹp. Khi volatility/risk-off tăng. Khi cấu trúc trend bị phá. Common variants: Positive swap portfolio. Carry + momentum. Carry + volatility filter. Use fixed fractional risk 1% per trade. If stop or target is not explicit, use stop 1.5 ATR and target 3 ATR."
  },
  {
    "id": "11-3-economic-news-trading",
    "sourceIndex": "11.3",
    "name": "Economic-News Trading",
    "category": "FUNDAMENTAL, MACRO VÀ CARRY TRADE",
    "badge": "Strategy",
    "description": "Khai thác biến động khi công bố dữ liệu như CPI, NFP, FOMC, lãi suất, GDP, PMI.",
    "prompt": "Strategy: Economic-News Trading. Core idea: Khai thác biến động khi công bố dữ liệu như CPI, NFP, FOMC, lãi suất, GDP, PMI.. Use fixed fractional risk 1% per trade. If stop or target is not explicit, use stop 1.5 ATR and target 3 ATR."
  },
  {
    "id": "11-4-currency-strength-relative-macro",
    "sourceIndex": "11.4",
    "name": "Currency Strength / Relative Macro",
    "category": "FUNDAMENTAL, MACRO VÀ CARRY TRADE",
    "badge": "Strategy",
    "description": "So sánh sức mạnh tương đối của các đồng tiền để chọn cặp mạnh-yếu.",
    "prompt": "Strategy: Currency Strength / Relative Macro. Core idea: So sánh sức mạnh tương đối của các đồng tiền để chọn cặp mạnh-yếu.. Common variants: Currency strength meter. Interest rate differential. Inflation differential. Use fixed fractional risk 1% per trade. If stop or target is not explicit, use stop 1.5 ATR and target 3 ATR."
  },
  {
    "id": "12-1-correlation-trading",
    "sourceIndex": "12.1",
    "name": "Correlation Trading",
    "category": "INTERMARKET, CORRELATION VÀ PAIRS",
    "badge": "Strategy",
    "description": "Một số tài sản/cặp có tương quan theo giai đoạn; dùng như confirmation hoặc hedge, không coi là quy luật bất biến.",
    "prompt": "Strategy: Correlation Trading. Core idea: Một số tài sản/cặp có tương quan theo giai đoạn; dùng như confirmation hoặc hedge, không coi là quy luật bất biến.. Common variants: Rolling correlation filter. Correlation breakdown. Intermarket confirmation. Use fixed fractional risk 1% per trade. If stop or target is not explicit, use stop 1.5 ATR and target 3 ATR."
  },
  {
    "id": "12-2-pairs-trading-cointegration",
    "sourceIndex": "12.2",
    "name": "Pairs Trading / Cointegration",
    "category": "INTERMARKET, CORRELATION VÀ PAIRS",
    "badge": "Strategy",
    "description": "Giao dịch chênh lệch giữa hai series có quan hệ thống kê ổn định hơn là dự đoán hướng tuyệt đối.",
    "prompt": "Strategy: Pairs Trading / Cointegration. Core idea: Giao dịch chênh lệch giữa hai series có quan hệ thống kê ổn định hơn là dự đoán hướng tuyệt đối.. Entry rules: Kiểm tra cointegration. Tính spread/z-score. Long spread khi z-score thấp cực trị, short spread khi cao cực trị. Exit and risk rules: Spread về mean. Stop nếu z-score tiếp tục mở rộng / quan hệ gãy. Common variants: EUR/USD vs GBP/USD. AUD/USD vs NZD/USD. Basket pairs. Use fixed fractional risk 1% per trade. If stop or target is not explicit, use stop 1.5 ATR and target 3 ATR."
  },
  {
    "id": "12-3-triangular-arbitrage",
    "sourceIndex": "12.3",
    "name": "Triangular Arbitrage",
    "category": "INTERMARKET, CORRELATION VÀ PAIRS",
    "badge": "Strategy",
    "description": "Tận dụng sai lệch ngắn giữa ba tỷ giá liên quan, ví dụ A/B × B/C khác A/C.",
    "prompt": "Strategy: Triangular Arbitrage. Core idea: Tận dụng sai lệch ngắn giữa ba tỷ giá liên quan, ví dụ A/B × B/C khác A/C.. Use fixed fractional risk 1% per trade. If stop or target is not explicit, use stop 1.5 ATR and target 3 ATR."
  },
  {
    "id": "13-1-one-minute-five-minute-ema-scalp",
    "sourceIndex": "13.1",
    "name": "One-Minute / Five-Minute EMA Scalp",
    "category": "SCALPING STRATEGIES",
    "badge": "Trend",
    "description": "Dùng EMA nhanh để vào theo momentum ngắn hạn.",
    "prompt": "Strategy: One-Minute / Five-Minute EMA Scalp. Core idea: Dùng EMA nhanh để vào theo momentum ngắn hạn.. Entry rules: Trend filter M5/M15. M1 hồi về EMA 9/20/21. Nến xác nhận quay lại theo trend. Exit and risk rules: SL nhỏ theo swing/ATR. TP 1R–1.5R hoặc fixed points. Use fixed fractional risk 1% per trade. If stop or target is not explicit, use stop 1.5 ATR and target 3 ATR."
  },
  {
    "id": "13-2-momentum-scalping",
    "sourceIndex": "13.2",
    "name": "Momentum Scalping",
    "category": "SCALPING STRATEGIES",
    "badge": "Scalp",
    "description": "Vào theo burst động lượng khi nến lớn phá vùng ngắn hạn.",
    "prompt": "Strategy: Momentum Scalping. Core idea: Vào theo burst động lượng khi nến lớn phá vùng ngắn hạn.. Use fixed fractional risk 1% per trade. If stop or target is not explicit, use stop 1.5 ATR and target 3 ATR."
  },
  {
    "id": "13-3-order-flow-dom-scalping",
    "sourceIndex": "13.3",
    "name": "Order Flow / DOM Scalping",
    "category": "SCALPING STRATEGIES",
    "badge": "Scalp",
    "description": "Dựa trên depth of market, tape, volume delta hoặc footprint để đánh giá thanh khoản gần giá.",
    "prompt": "Strategy: Order Flow / DOM Scalping. Core idea: Dựa trên depth of market, tape, volume delta hoặc footprint để đánh giá thanh khoản gần giá.. Use fixed fractional risk 1% per trade. If stop or target is not explicit, use stop 1.5 ATR and target 3 ATR."
  },
  {
    "id": "13-4-micro-range-scalping",
    "sourceIndex": "13.4",
    "name": "Micro Range Scalping",
    "category": "SCALPING STRATEGIES",
    "badge": "Mean reversion",
    "description": "Trade biên của range rất ngắn trong khung M1/M5.",
    "prompt": "Strategy: Micro Range Scalping. Core idea: Trade biên của range rất ngắn trong khung M1/M5.. Use fixed fractional risk 1% per trade. If stop or target is not explicit, use stop 1.5 ATR and target 3 ATR."
  },
  {
    "id": "14-1-fixed-grid",
    "sourceIndex": "14.1",
    "name": "Fixed Grid",
    "category": "GRID, DCA, MARTINGALE VÀ RECOVERY",
    "badge": "High risk",
    "description": "Đặt lệnh cách nhau một khoảng cố định.",
    "prompt": "Strategy: Fixed Grid. Core idea: Đặt lệnh cách nhau một khoảng cố định.. Common variants: Neutral grid. Trend grid. Countertrend grid. Use fixed fractional risk 1% per trade. If stop or target is not explicit, use stop 1.5 ATR and target 3 ATR."
  },
  {
    "id": "14-2-dca-averaging-down",
    "sourceIndex": "14.2",
    "name": "DCA / Averaging Down",
    "category": "GRID, DCA, MARTINGALE VÀ RECOVERY",
    "badge": "High risk",
    "description": "Thêm vị thế khi giá đi ngược để cải thiện giá vốn trung bình.",
    "prompt": "Strategy: DCA / Averaging Down. Core idea: Thêm vị thế khi giá đi ngược để cải thiện giá vốn trung bình.. Use fixed fractional risk 1% per trade. If stop or target is not explicit, use stop 1.5 ATR and target 3 ATR."
  },
  {
    "id": "14-3-martingale-anti-martingale",
    "sourceIndex": "14.3",
    "name": "Martingale / Anti-Martingale",
    "category": "GRID, DCA, MARTINGALE VÀ RECOVERY",
    "badge": "High risk",
    "description": "Tăng khối lượng sau lệnh thua để kỳ vọng một lệnh thắng bù lại chuỗi lỗ.",
    "prompt": "Strategy: Martingale / Anti-Martingale. Core idea: Tăng khối lượng sau lệnh thua để kỳ vọng một lệnh thắng bù lại chuỗi lỗ.. Use fixed fractional risk 1% per trade. If stop or target is not explicit, use stop 1.5 ATR and target 3 ATR."
  },
  {
    "id": "14-4-hedged-grid-recovery-zone-locking",
    "sourceIndex": "14.4",
    "name": "Hedged Grid / Recovery Zone / Locking",
    "category": "GRID, DCA, MARTINGALE VÀ RECOVERY",
    "badge": "High risk",
    "description": "Mở lệnh đối ứng để khóa tạm thời drawdown, sau đó tìm cách mở khóa.",
    "prompt": "Strategy: Hedged Grid / Recovery Zone / Locking. Core idea: Mở lệnh đối ứng để khóa tạm thời drawdown, sau đó tìm cách mở khóa.. Use fixed fractional risk 1% per trade. If stop or target is not explicit, use stop 1.5 ATR and target 3 ATR."
  },
  {
    "id": "15-1-time-series-momentum",
    "sourceIndex": "15.1",
    "name": "Time-Series Momentum",
    "category": "QUANT / ALGORITHMIC STRATEGIES",
    "badge": "Quant",
    "description": "Nếu return quá khứ trong một lookback dương/âm, giữ cùng hướng trong horizon tiếp theo.",
    "prompt": "Strategy: Time-Series Momentum. Core idea: Nếu return quá khứ trong một lookback dương/âm, giữ cùng hướng trong horizon tiếp theo.. Common variants: 20/60/120-day momentum. Volatility-scaled momentum. Dual momentum. Use fixed fractional risk 1% per trade. If stop or target is not explicit, use stop 1.5 ATR and target 3 ATR."
  },
  {
    "id": "15-2-statistical-mean-reversion",
    "sourceIndex": "15.2",
    "name": "Statistical Mean Reversion",
    "category": "QUANT / ALGORITHMIC STRATEGIES",
    "badge": "Mean reversion",
    "description": "Dùng z-score, deviation from moving average hoặc residual để đo quá lệch.",
    "prompt": "Strategy: Statistical Mean Reversion. Core idea: Dùng z-score, deviation from moving average hoặc residual để đo quá lệch.. Entry rules: z-score vượt ngưỡng ±2. Có regime filter để tránh trend mạnh. Exit khi z-score về 0 hoặc vùng nhỏ hơn. Common variants: Bollinger z-score. Ornstein–Uhlenbeck model. Kalman filter residual. Use fixed fractional risk 1% per trade. If stop or target is not explicit, use stop 1.5 ATR and target 3 ATR."
  },
  {
    "id": "15-3-volatility-breakout-volatility-targeting",
    "sourceIndex": "15.3",
    "name": "Volatility Breakout / Volatility Targeting",
    "category": "QUANT / ALGORITHMIC STRATEGIES",
    "badge": "Breakout",
    "description": "Khi volatility tăng sau nén, breakout dễ mở rộng; position size giảm khi ATR/realized volatility cao.",
    "prompt": "Strategy: Volatility Breakout / Volatility Targeting. Core idea: Khi volatility tăng sau nén, breakout dễ mở rộng; position size giảm khi ATR/realized volatility cao.. Common variants: ATR channel breakout. Parkinson volatility. EWMA volatility. Use fixed fractional risk 1% per trade. If stop or target is not explicit, use stop 1.5 ATR and target 3 ATR."
  },
  {
    "id": "15-4-regime-detection",
    "sourceIndex": "15.4",
    "name": "Regime Detection",
    "category": "QUANT / ALGORITHMIC STRATEGIES",
    "badge": "Quant",
    "description": "Không dùng một chiến lược cho mọi thị trường. Trước tiên phân loại trend/range/high-volatility/low-volatility.",
    "prompt": "Strategy: Regime Detection. Core idea: Không dùng một chiến lược cho mọi thị trường. Trước tiên phân loại trend/range/high-volatility/low-volatility.. Use fixed fractional risk 1% per trade. If stop or target is not explicit, use stop 1.5 ATR and target 3 ATR."
  },
  {
    "id": "15-5-machine-learning-forecasting",
    "sourceIndex": "15.5",
    "name": "Machine Learning Forecasting",
    "category": "QUANT / ALGORITHMIC STRATEGIES",
    "badge": "Quant",
    "description": "Logistic regression.",
    "prompt": "Strategy: Machine Learning Forecasting. Core idea: Logistic regression.. Common variants: ATR trailing. Chandelier exit. MA trailing. Use fixed fractional risk 1% per trade. If stop or target is not explicit, use stop 1.5 ATR and target 3 ATR."
  },
  {
    "id": "17-1-ema-trend-bollinger-regime-atr-exit",
    "sourceIndex": "17.1",
    "name": "EMA Trend + Bollinger Regime + ATR Exit",
    "category": "CÁC COMBO CHIẾN LƯỢC THỰC DỤNG",
    "badge": "Trend",
    "description": "Strategy template that users can edit in the prompt before backtesting.",
    "prompt": "Strategy: EMA Trend + Bollinger Regime + ATR Exit. Core idea: Strategy template that users can edit in the prompt before backtesting.. Use fixed fractional risk 1% per trade. If stop or target is not explicit, use stop 1.5 ATR and target 3 ATR."
  },
  {
    "id": "17-2-htf-bias-ltf-liquidity-sweep-fvg",
    "sourceIndex": "17.2",
    "name": "HTF Bias + LTF Liquidity Sweep + FVG",
    "category": "CÁC COMBO CHIẾN LƯỢC THỰC DỤNG",
    "badge": "SMC/ICT",
    "description": "Strategy template that users can edit in the prompt before backtesting.",
    "prompt": "Strategy: HTF Bias + LTF Liquidity Sweep + FVG. Core idea: Strategy template that users can edit in the prompt before backtesting.. Use fixed fractional risk 1% per trade. If stop or target is not explicit, use stop 1.5 ATR and target 3 ATR."
  },
  {
    "id": "17-3-asian-range-london-breakout-retest",
    "sourceIndex": "17.3",
    "name": "Asian Range + London Breakout + Retest",
    "category": "CÁC COMBO CHIẾN LƯỢC THỰC DỤNG",
    "badge": "Mean reversion",
    "description": "Strategy template that users can edit in the prompt before backtesting.",
    "prompt": "Strategy: Asian Range + London Breakout + Retest. Core idea: Strategy template that users can edit in the prompt before backtesting.. Use fixed fractional risk 1% per trade. If stop or target is not explicit, use stop 1.5 ATR and target 3 ATR."
  },
  {
    "id": "17-4-donchian-breakout-atr-position-sizing",
    "sourceIndex": "17.4",
    "name": "Donchian Breakout + ATR Position Sizing",
    "category": "CÁC COMBO CHIẾN LƯỢC THỰC DỤNG",
    "badge": "Breakout",
    "description": "Strategy template that users can edit in the prompt before backtesting.",
    "prompt": "Strategy: Donchian Breakout + ATR Position Sizing. Core idea: Strategy template that users can edit in the prompt before backtesting.. Use fixed fractional risk 1% per trade. If stop or target is not explicit, use stop 1.5 ATR and target 3 ATR."
  }
] as const satisfies readonly ForexStrategyLibraryItem[];

export const FOREX_STRATEGY_CATEGORIES = [
  "TREND FOLLOWING — ĐI THEO XU HƯỚNG",
  "PULLBACK, RETRACEMENT VÀ CONTINUATION PATTERN",
  "RANGE TRADING — GIAO DỊCH SIDEWAY",
  "BREAKOUT TRADING — PHÁ VỠ VÙNG GIÁ",
  "PRICE ACTION VÀ CANDLESTICK STRATEGIES",
  "MEAN REVERSION VÀ OSCILLATOR STRATEGIES",
  "SMART MONEY CONCEPTS / ICT / LIQUIDITY-BASED",
  "HARMONIC, ELLIOTT VÀ MÔ HÌNH HÌNH HỌC",
  "SESSION-BASED FOREX STRATEGIES",
  "FUNDAMENTAL, MACRO VÀ CARRY TRADE",
  "INTERMARKET, CORRELATION VÀ PAIRS",
  "SCALPING STRATEGIES",
  "GRID, DCA, MARTINGALE VÀ RECOVERY",
  "QUANT / ALGORITHMIC STRATEGIES",
  "CÁC COMBO CHIẾN LƯỢC THỰC DỤNG"
] as const;
