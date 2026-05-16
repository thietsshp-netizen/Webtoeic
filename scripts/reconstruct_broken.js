
const XLSX = require('xlsx');
const inputFile = '/Users/thietphamvan/hoctoeic/Webtoeic/Part 3_4/Part34_Json_Final.xlsx';

const rowFixes = {
  "ETS2026_TEST_02_59_61": {
    "passages": [
      {
        "category": "Conversation 59-61",
        "html_content": "<div data-sid='s1'><b>W-Am:</b> Hello. I'd like to buy some new floor mats. It's for the waiting room at <sup>59</sup><b>my hair salon.</b></div><div data-sid='s2'><b>M-Cn:</b> We have many different styles. <sup>60</sup><b>Are you looking for something in particular?</b></div><div data-sid='s3'><b>W-Am:</b> <sup>60</sup><b>Well, we have a lot of customers walking in and out, and our current carpeting is a light color.</b></div><div data-sid='s4'><b>M-Cn:</b> No matter what color you choose, all of our carpets are durable and can stand up to high levels of foot traffic.</div><div data-sid='s5'>For a business like yours, I'd recommend putting a protective mat near the entrance.</div><div data-sid='s6'><b>W-Am:</b> That's a good idea.</div><div data-sid='s7'><b>M-Cn:</b> Also, <sup>61</sup><b>I offer free cleaning services for a year for all carpet purchases.</b></div>",
        "translation_map": {
          "s1": "<b>Nữ (Mỹ):</b> Xin chào. Tôi muốn mua một số thảm trải sàn mới. Nó dành cho phòng chờ tại <sup>59</sup><b>tiệm làm tóc của tôi.</b>",
          "s2": "<b>Nam (Trung Quốc):</b> Chúng tôi có nhiều kiểu dáng khác nhau. <sup>60</sup><b>Cô đang tìm kiếm điều gì đó đặc biệt phải không?</b>",
          "s3": "<b>Nữ (Mỹ):</b> <sup>60</sup><b>À, chúng tôi có rất nhiều khách hàng ra vào, và thảm hiện tại của chúng tôi là màu sáng.</b>",
          "s4": "<b>Nam (Trung Quốc):</b> Dù cô chọn màu gì, tất cả thảm của chúng tôi đều bền và có thể chịu được lưu lượng người đi lại cao.",
          "s5": "Đối với những cơ sở kinh doanh như của cô, tôi khuyên nên đặt một tấm thảm bảo vệ gần cửa ra vào.",
          "s6": "<b>Nữ (Mỹ):</b> Đó là một ý kiến hay.",
          "s7": "<b>Nam (Trung Quốc):</b> Ngoài ra, <sup>61</sup><b>tôi cung cấp dịch vụ vệ sinh miễn phí trong một năm cho tất cả các đơn hàng mua thảm.</b>"
        }
      }
    ],
    "questions": [
      {
        "questionNo": 59,
        "text": "What type of business does the woman work in?",
        "options": { "A": "A hair salon", "B": "A real estate agency", "C": "An interior design firm", "D": "A car rental company" },
        "correct": "A",
        "evidence_sids": ["s1"],
        "explanation": { "vi": "Người nữ nhắc đến 'my hair salon' (tiệm làm tóc của tôi).", "options_vn": { "A": "Một tiệm làm tóc", "B": "Đại lý bất động sản", "C": "Công ty thiết kế", "D": "Công ty thuê xe" }, "analysis": "Thông tin rõ ràng ở câu đầu tiên khi cô ấy nói mục đích mua thảm cho tiệm làm tóc." }
      },
      {
        "questionNo": 60,
        "text": "Why does the woman say, “our current carpeting is a light color”?",
        "options": { "A": "To suggest an expense was not justified", "B": "To express surprise about a decision", "C": "To describe a problem with an order", "D": "To indicate the need to make a change" },
        "correct": "D",
        "evidence_sids": ["s3"],
        "explanation": { "vi": "Tại sao người nữ nói 'thảm hiện tại là màu sáng'?", "options_vn": { "A": "Gợi ý chi phí không hợp lý", "B": "Bày tỏ sự ngạc nhiên", "C": "Mô tả vấn đề đơn hàng", "D": "Chỉ ra nhu cầu cần thay đổi" }, "analysis": "Vì thảm màu sáng dễ bẩn khi có nhiều khách ra vào, nên cô ấy ngụ ý cần thay đổi sang loại khác phù hợp hơn." }
      },
      {
        "questionNo": 61,
        "text": "What does the man’s business offer?",
        "options": { "A": "A bulk discount", "B": "Same-day delivery", "C": "Free cleaning services", "D": "Monthly inspections" },
        "correct": "C",
        "evidence_sids": ["s7"],
        "explanation": { "vi": "Doanh nghiệp của người nam cung cấp điều gì?", "options_vn": { "A": "Chiết khấu số lượng", "B": "Giao hàng trong ngày", "C": "Dịch vụ vệ sinh miễn phí", "D": "Kiểm tra hàng tháng" }, "analysis": "Người nam trực tiếp nhắc đến 'free cleaning services for a year'." }
      }
    ]
  },
  "ETS2026_TEST_04_59_61": {
    "passages": [
      {
        "category": "Conversation 59-61",
        "html_content": "<div data-sid='s1'><b>W-Br:</b> Hi, Shinji.</div><div data-sid='s2'>I wanted to ask you about <sup>59</sup><b>the order we got from the department store chain.</b></div><div data-sid='s3'>You know, <sup>59</sup><b>the one that placed an order for 5,000 jigsaw puzzles?</b></div><div data-sid='s4'><b>M-Au:</b> Yes.</div><div data-sid='s5'><sup>60</sup><b>They want the order in a week so they can stock them before the holiday.</b></div><div data-sid='s6'><b>W-Br:</b> A week is not a long time.</div><div data-sid='s7'><b>M-Au:</b> We've had short timelines before.</div><div data-sid='s8'>Anyway, <sup>61</sup><b>our illustrators sent some new puzzle illustrations, right?</b></div><div data-sid='s9'>I heard they're making a special edition.</div><div data-sid='s10'><b>W-Br:</b> Yes, and I'm so excited!</div><div data-sid='s11'><sup>61</sup><b>I've got the sketches right here.</b></div><div data-sid='s12'>Let me show you.</div>",
        "translation_map": {
          "s1": "<b>Nữ (Anh):</b> Chào Shinji.",
          "s2": "Tôi muốn hỏi anh về <sup>59</sup><b>đơn đặt hàng chúng ta nhận được từ chuỗi cửa hàng bách hóa.</b>",
          "s3": "Anh biết đấy, <sup>59</sup><b>đơn hàng đặt 5.000 bộ xếp hình ấy?</b>",
          "s4": "<b>Nam (Úc):</b> Vâng.",
          "s5": "<sup>60</sup><b>Họ muốn có đơn hàng trong một tuần để họ có thể nhập kho trước kỳ nghỉ lễ.</b>",
          "s6": "<b>Nữ (Anh):</b> Một tuần không phải là thời gian dài.",
          "s7": "<b>Nam (Úc):</b> Chúng ta đã từng có những mốc thời gian ngắn trước đây rồi.",
          "s8": "Dù sao thì, <sup>61</sup><b>các họa sĩ minh họa của chúng ta đã gửi một số hình minh họa xếp hình mới rồi, phải không?</b>",
          "s9": "Tôi nghe nói họ đang làm một phiên bản đặc biệt.",
          "s10": "<b>Nữ (Anh):</b> Vâng, và tôi rất hào hứng!",
          "s11": "<sup>61</sup><b>Tôi đang có các bản phác thảo ngay tại đây.</b>",
          "s12": "Để tôi cho anh xem."
        }
      }
    ],
    "questions": [
      {
        "questionNo": 59,
        "text": "What does the speakers' company manufacture?",
        "options": { "A": "Art supplies", "B": "Puzzles", "C": "Shipping materials", "D": "Power tools" },
        "correct": "B",
        "evidence_sids": ["s2", "s3"],
        "explanation": { "vi": "Công ty sản xuất mặt hàng gì?", "options_vn": { "A": "Họa cụ", "B": "Trò chơi xếp hình", "C": "Vật liệu vận chuyển", "D": "Dụng cụ điện" }, "analysis": "Người nữ nhắc đến đơn hàng '5,000 jigsaw puzzles', cho thấy họ sản xuất trò chơi xếp hình." }
      },
      {
        "questionNo": 60,
        "text": "What does the woman imply when she says, “A week is not a long time”?",
        "options": { "A": "Some prices will likely increase.", "B": "Some temporary employees have been hired.", "C": "A colleague's work is excellent.", "D": "An order may not be filled." },
        "correct": "D",
        "evidence_sids": ["s5", "s6"],
        "explanation": { "vi": "Người phụ nữ ngụ ý gì?", "options_vn": { "A": "Giá tăng", "B": "Thuê nhân viên tạm thời", "C": "Đồng nghiệp xuất sắc", "D": "Đơn hàng có thể không hoàn thành" }, "analysis": "Câu nói thể hiện sự lo ngại về thời gian quá ngắn để hoàn thành đơn hàng lớn." }
      },
      {
        "questionNo": 61,
        "text": "What will the woman do next?",
        "options": { "A": "Review a contract", "B": "Print out an invoice", "C": "Share some illustrations", "D": "Confirm a client meeting" },
        "correct": "C",
        "evidence_sids": ["s8", "s11", "s12"],
        "explanation": { "vi": "Người phụ nữ sẽ làm gì tiếp theo?", "options_vn": { "A": "Xem xét hợp đồng", "B": "In hóa đơn", "C": "Chia sẻ hình minh họa", "D": "Xác nhận cuộc họp" }, "analysis": "Cô ấy nói đang cầm các bản phác thảo (sketches) và đề nghị cho người nam xem." }
      }
    ]
  }
};

const workbook = XLSX.readFile(inputFile);
const data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

data.forEach(row => {
  if (rowFixes[row.AudioID]) {
    row.Json = JSON.stringify(rowFixes[row.AudioID], null, 2);
  }
});

const newSheet = XLSX.utils.json_to_sheet(data);
const newWb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(newWb, newSheet, workbook.SheetNames[0]);
XLSX.writeFile(newWb, inputFile);
console.log("Reconstructed Row 264 and 310 successfully.");
