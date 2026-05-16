import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const bookTitle = "ETS2024";
    const testTitle = "Test 1";
    
    // Tìm hoặc tạo ToeicTest
    let test = await prisma.toeicTest.findFirst({
      where: { title: `${bookTitle} - ${testTitle}` }
    });

    if (!test) {
      test = await prisma.toeicTest.create({
        data: {
          title: `${bookTitle} - ${testTitle}`,
          description: "Test tự động tạo cho Part 6",
          isPublished: true,
        }
      });
    }

    // Tìm hoặc tạo ToeicPart 6
    let part6 = await prisma.toeicPart.findFirst({
      where: { testId: test.id, partNumber: 6 }
    });

    if (!part6) {
      part6 = await prisma.toeicPart.create({
        data: {
          testId: test.id,
          partNumber: 6,
          title: "Part 6: Text Completion",
        }
      });
    }

    // JSON Dữ liệu mẫu cung cấp
    const passageJson = {
      passage: {
        english: [
          {
            sentenceID: 1,
            is_new_paragraph: true,
            text: "Look to Riessler Landscaping for your Garden Needs",
            highlight: null
          },
          {
            sentenceID: 2,
            is_new_paragraph: true,
            text: "Riessler Landscaping has everything you need to create your dream garden.",
            highlight: null
          },
          {
            sentenceID: 3,
            is_new_paragraph: false,
            text: "We will listen to your ideas and offer suggestions that match your gardening desires.",
            highlight: null
          },
          {
            sentenceID: 4,
            is_new_paragraph: false,
            text: "<sup>131</sup> **Riessler Landscaping's goal is to make your vision a reality.**",
            highlight: "yellow"
          },
          {
            sentenceID: 5,
            is_new_paragraph: false,
            text: "The nursery here at Riessler Landscaping includes plants of many varieties and sizes that burst with eye-catching colors year-round.",
            highlight: null
          },
          {
            sentenceID: 6,
            is_new_paragraph: false,
            text: "You are guaranteed to find something that will add <sup>132</sup> **beauty** to your garden.",
            highlight: "cyan"
          },
          {
            sentenceID: 7,
            is_new_paragraph: false,
            text: "We are <sup>133</sup> **also** equipped to construct small ponds or other water features.",
            highlight: "green"
          },
          {
            sentenceID: 8,
            is_new_paragraph: false,
            text: "And as our name suggests, we can take on more ambitious landscaping projects—whatever you need!",
            highlight: null
          },
          {
            sentenceID: 9,
            is_new_paragraph: false,
            text: "With more than 40 years in the landscape-design business, <sup>134</sup> **our** expertise is unmatched.",
            highlight: "magenta"
          },
          {
            sentenceID: 10,
            is_new_paragraph: false,
            text: "To register, visit www.maxley-horticulture.org.",
            highlight: null
          }
        ],
        vietnamese: [
          {
            sentenceID: 1,
            is_new_paragraph: true,
            text: "Hãy tìm đến Riessler Landscaping cho các nhu cầu về khu vườn của bạn"
          },
          {
            sentenceID: 2,
            is_new_paragraph: true,
            text: "Riessler Landscaping có mọi thứ bạn cần để tạo ra khu vườn mơ ước của mình."
          },
          {
            sentenceID: 3,
            is_new_paragraph: false,
            text: "Chúng tôi sẽ lắng nghe ý tưởng của bạn và đưa ra những gợi ý phù hợp với mong muốn làm vườn của bạn."
          },
          {
            sentenceID: 4,
            is_new_paragraph: false,
            text: "Mục tiêu của Riessler Landscaping là biến tầm nhìn của bạn thành hiện thực."
          },
          {
            sentenceID: 5,
            is_new_paragraph: false,
            text: "Vườn ươm tại Riessler Landscaping bao gồm nhiều loại cây với kích cỡ khác nhau, rực rỡ với màu sắc bắt mắt quanh năm."
          },
          {
            sentenceID: 6,
            is_new_paragraph: false,
            text: "Bạn chắc chắn sẽ tìm thấy thứ gì đó giúp tăng thêm vẻ đẹp cho khu vườn của mình."
          },
          {
            sentenceID: 7,
            is_new_paragraph: false,
            text: "Chúng tôi cũng được trang bị để xây dựng các hồ nhỏ hoặc các tính năng nước khác."
          },
          {
            sentenceID: 8,
            is_new_paragraph: false,
            text: "Và như tên gọi của chúng tôi, chúng tôi có thể đảm nhận các dự án cảnh quan đầy tham vọng hơn—bất cứ điều gì bạn cần!"
          },
          {
            sentenceID: 9,
            is_new_paragraph: false,
            text: "Với hơn 40 năm kinh nghiệm trong lĩnh vực thiết kế cảnh quan, kiến thức chuyên môn của chúng tôi là vô song."
          },
          {
            sentenceID: 10,
            is_new_paragraph: false,
            text: "Để đăng ký, hãy truy cập www.maxley-horticulture.org."
          }
        ]
      },
      questions: [
        {
          id: 131,
          correct_answer: "D",
          options: {
            A: "Staff members have written articles for the local newspaper.",
            B: "Installing lights can enhance the effect of a well-designed garden.",
            C: "Local competitors cannot beat the prices we charge.",
            D: "Riessler Landscaping's goal is to make your vision a reality."
          },
          options_vn: {
            A: "Các nhân viên đã viết bài cho tờ báo địa phương.",
            B: "Việc lắp đặt đèn có thể làm tăng hiệu quả của một khu vườn được thiết kế tốt.",
            C: "Các đối thủ cạnh tranh địa phương không thể đánh bại mức giá chúng tôi tính.",
            D: "Mục tiêu của Riessler Landscaping là biến tầm nhìn của bạn thành hiện thực."
          },
          explanation: {
            why_correct: "Câu này kiểm tra khả năng đọc hiểu ngữ cảnh. Câu trước đề cập đến việc 'lắng nghe ý tưởng' và 'phù hợp mong muốn'. Do đó, việc nói về 'biến tầm nhìn thành hiện thực' là sự tiếp nối logic nhất.",
            wrong: {
              A: "Việc viết bài báo không liên quan đến dịch vụ khách hàng đang đề cập.",
              B: "Nội dung về ánh sáng quá cụ thể và chưa xuất hiện trong mạch văn chung.",
              C: "Đoạn văn đang tập trung vào chất lượng dịch vụ, không phải cạnh tranh về giá.",
              D: "Đáp án đúng, khớp với việc hiện thực hóa ý tưởng khách hàng."
            }
          },
          highlight_color: "yellow"
        },
        {
          id: 132,
          correct_answer: "C",
          options: {
            A: "years",
            B: "space",
            C: "beauty",
            D: "moisture"
          },
          options_vn: {
            A: "năm",
            B: "không gian",
            C: "vẻ đẹp",
            D: "độ ẩm"
          },
          explanation: {
            why_correct: "Câu này kiểm tra từ vựng. Dựa vào câu trước nói về 'cây cối nhiều chủng loại' và 'màu sắc bắt mắt', từ phù hợp nhất để điền vào chỗ trống 'add ... to your garden' là 'beauty' (vẻ đẹp).",
            wrong: {
              A: "Cây cối không thêm 'năm' vào vườn theo cách diễn đạt này.",
              B: "Trồng thêm cây thường chiếm không gian chứ không phải thêm không gian.",
              C: "Đây là đáp án đúng.",
              D: "Màu sắc bắt mắt không liên quan đến việc tăng độ ẩm."
            }
          },
          highlight_color: "cyan"
        },
        {
          id: 133,
          correct_answer: "A",
          options: {
            A: "also",
            B: "rarely",
            C: "somehow",
            D: "nevertheless"
          },
          options_vn: {
            A: "cũng",
            B: "hiếm khi",
            C: "bằng cách nào đó",
            D: "tuy nhiên"
          },
          explanation: {
            why_correct: "Đây là câu hỏi về trạng từ liên kết. Sau khi liệt kê dịch vụ cung cấp cây cảnh, công ty giới thiệu thêm một dịch vụ khác là xây hồ (construct small ponds), nên dùng 'also' để bổ sung thông tin.",
            wrong: {
              A: "Đây là đáp án đúng.",
              B: "Mang nghĩa tiêu cực, không phù hợp quảng cáo.",
              C: "Mơ hồ, không phù hợp văn phong chuyên nghiệp.",
              D: "Dùng để chỉ sự đối lập, không phù hợp ở đây."
            }
          },
          highlight_color: "green"
        },
        {
          id: 134,
          correct_answer: "B",
          options: {
            A: "its",
            B: "our",
            C: "others",
            D: "their"
          },
          options_vn: {
            A: "của nó",
            B: "của chúng tôi",
            C: "những cái khác",
            D: "của họ"
          },
          explanation: {
            why_correct: "Câu hỏi về tính từ sở hữu. Người viết flyer đang đại diện cho công ty (sử dụng 'we' xuyên suốt đoạn văn), nên khi nói về chuyên môn của công ty mình phải dùng 'our'.",
            wrong: {
              A: "Dùng cho vật số ít, không phù hợp đại diện cho đội ngũ công ty.",
              B: "Đây là đáp án đúng.",
              C: "Đại từ không phù hợp đứng trước danh từ 'expertise'.",
              D: "Dùng để nói về một bên thứ ba, không phải chủ thể đang quảng cáo."
            }
          },
          highlight_color: "magenta"
        }
      ]
    };

    // Tạo Question Group
    const groupData = {
      partId: part6.id,
      passageText: JSON.stringify(passageJson.passage),
      metadata: {
        book: bookTitle,
        test: testTitle,
        type: "Flyer",
        day: "1"
      }
    };

    // Tìm nếu đã có thì update, không thì create
    const existingGroup = await prisma.toeicQuestionGroup.findFirst({
      where: {
        partId: part6.id,
        metadata: {
          path: ['book'],
          equals: bookTitle
        },
        AND: {
          metadata: {
            path: ['test'],
            equals: testTitle
          }
        }
      }
    });

    const group = await prisma.toeicQuestionGroup.upsert({
      where: { id: existingGroup?.id || 'new-group' },
      update: groupData,
      create: groupData
    });

    const savedQuestions = [];

    for (const q of passageJson.questions) {
      const qd = {
        groupId: group.id,
        questionNo: q.id, // e.g. 131
        questionText: "", // Part 6 doesn't have a question text usually, just the blank
        optionA: q.options.A,
        optionB: q.options.B,
        optionC: q.options.C,
        optionD: q.options.D,
        correctAnswer: q.correct_answer,
        explanation: JSON.stringify({
          why_correct: q.explanation.why_correct,
          wrong: q.explanation.wrong
        }),
        metadata: {
          options_vn: q.options_vn,
          highlight_color: q.highlight_color,
        }
      };

      const existingQuestion = await prisma.toeicQuestion.findFirst({
        where: { groupId: group.id, questionNo: q.id }
      });

      const saved = await prisma.toeicQuestion.upsert({
        where: { id: existingQuestion?.id || 'new-question' },
        update: qd,
        create: qd
      });
      savedQuestions.push(saved);
    }

    return NextResponse.json({
      success: true,
      message: "Seeded part 6 successfully!",
      group,
      questions: savedQuestions
    });

  } catch (error: any) {
    console.error("Error seeding:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
