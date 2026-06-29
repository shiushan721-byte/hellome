import React from 'react';
import './index.scss';

/** 可复用的隐私政策正文（智能体词元(Token)工场），供登录弹窗使用 */
export const PrivacyPolicyContent: React.FC = () => (
  <div className="terms-content">
    <div className="mt-3 mb-4 text-2xl font-bold text-center">隐私协议</div>
    <div className="mb-4 leading-5">最近更新日期：2026年 4月9日</div>

    <div className="terms-intro flex flex-col gap-2">
      <p className="leading-5">您的信任对江苏汇智智能数字科技有限公司（以下简称“汇智智能”或“我们”，位于南京市雨花台区软件大道178号4幢302-303室）非常重要，在为您提供智能体词元(Token)工场服务的过程中，我们深知个人信息安全的重要性，我们将按法律法规要求，采取相应安全保护措施，尽力保护您的个人信息安全可控。鉴此，我们制定《智能体词元(Token)工场隐私政策》（下称“本隐私政策”）并提醒您：</p>
      <p className="leading-5">本隐私政策适用于汇智智能运营的智能体词元(Token)工场品牌下面向中国大陆地区的用户提供的的智能体词元(Token)工场网站、移动应用APP、移动端小程序及随其技术发展出现的新形态为您提供的相关产品或服务（“智能体词元(Token)工场产品或服务”）。如我们的其他产品或服务中使用了智能体词元(Token)工场服务，但未设独立隐私政策的，则本政策同样适用于该部分产品或服务。我们就向您提供的产品或服务单独设立有隐私政策的，则相应产品或服务适用其单独的隐私政策。</p>
      <p className="leading-5">需要特别说明的是，本隐私政策不适用于智能体词元(Token)工场产品或服务中其他第三方向您提供的其他服务，第三方向您提供的其他服务适用其向您另行说明的隐私政策。</p>
      <p className="leading-5">在使用智能体词元(Token)工场服务前，请您务必仔细阅读并透彻理解本隐私政策，特别是以粗体标识的条款，您应重点阅读，请在确认充分理解并同意后使用我们的产品或服务。您点击或勾选同意隐私政策表示您已阅读、理解并同意本政策的全部内容，了解智能体词元(Token)工场服务提供的功能，以及功能运行所需的必要个人信息，并给予相应的收集使用授权，如您不同意本隐私政策，将导致您无法使用智能体词元(Token)工场服务。</p>
      <p className="leading-5">除本隐私政策外，我们在特定场景下，通过弹窗、页面等及时告知方式向您说明对应的个人信息处理目的、范围和方式，以便获取您的授权同意，这些均构成本隐私政策的一部分，并与本隐私政策具有同等效力。如您有任何关于个人信息安全的投诉和举报，或者对本隐私政策内容有任何疑问、意见或建议，您可通过本隐私政策“九、如何联系我们”中披露的联系方式与我们联系。</p>
    </div>

    <section className="terms-section mt-5">
      <div className="text-lg font-bold mb-2 leading-[26px]">一、我们如何收集和使用个人信息</div>
      <div className="flex flex-col gap-2 leading-5">
        <p className="leading-5">我们将遵循合法、正当、必要的原则，收集和使用您的个人信息。</p>
        <p className="leading-5">具体而言，为了实现基本业务功能，您应按照我们的功能需求向我们提供或允许我们收集和使用您的个人信息；除基本业务功能之外，您可以自主决定是否向我们提供相关个人信息以使用我们提供的扩展业务功能。</p>
      </div>
      <div className="subsection flex flex-col gap-2">
        <h3>（一）用户注册</h3>
        <div className="flex flex-col gap-2 leading-5">
          <p className="leading-5">用户注册时，需要向我们提供您实名认证的手机号码注册并创建账号，否则您将不能使用、体验我们的产品或服务，我们将通过发送短信验证码的方式来验证您的身份是否有效真实。</p>
          <p className="leading-5">您所提供的手机号码和电子邮箱将作为您的联系方式用于我们向您进行身份验证，发送系统通知（例如订阅续订和到期，安全警报等）消息，用户体验调研以及与您取得联系提供客户服务等用途。</p>
          <p className="leading-5">如果您仅使用浏览服务，您不需要注册成为智能体词元(Token)工场服务的用户，也无需提供上述信息。</p>
        </div>
      </div>
      <div className="subsection flex flex-col gap-2">
        <h3>（二）提供内容生成服务</h3>
        <div className="flex flex-col gap-2 leading-5">
          <p className="leading-5">您通过服务创建、输入、上传或提交的内容（简称“您提供的内容”），包括问题、提示、生成的输出以及您创建的集合或页面。根据您提供的内容的性质及其与您帐户的关联，可能包含个人信息，例如您上传照片的元数据可能包含位置信息。特别提醒您，如果您上传的内容包含肖像（如人脸图像），该信息属于个人敏感信息。为了向您提供服务并持续优化算法模型、提升生成质量，我们会收集您提供的内容。您同意我们可能对上述信息进行去标识化处理后，用于机器学习、模型训练及技术研发。</p>
          <p className="leading-5">当您主动输入肖像类内容使用我们的服务时，我们会分析您上传的原始素材，找出原始素材中的特征点(比如眼睛、鼻子、嘴巴等的矢量点)和轮廓线以进行肖像处理。在此过程中，我们会对素材中的特征位点进行数学矢量化分析。前述处理仅涉及对像素规律的逻辑计算，不涉及对特定自然人身份的生物识别信息采集。 处理结果将根据业务逻辑进行自动覆盖或脱敏。</p>
          <p className="leading-5">若您提供的信息中含有其他用户的个人信息，在向我们提供这些个人信息之前，您需确保您已经取得合法的授权。</p>
          <p className="leading-5">如您提供的内容是通过相机拍摄、从相册或媒体库读取，从剪贴板读取或生成的内容存储在相册、媒体库时，我们会向您申请摄像头、相册、剪切板和存储权限。如果您不同意或取消授权，您将不能使用相应的功能，但不影响您使用其他功能。</p>
        </div>
      </div>
      <div className="subsection flex flex-col gap-2">
        <h3>（三）支付和管理订单</h3>
        <div className="flex flex-col gap-2 leading-5">
          <p className="leading-5">在您购买我们的产品和服务时，我们会通过支付服务提供方收集支付详情以便进行订单管理。为帮助您完成付费服务，您需要使用支付服务商的服务向其直接提供与完成交易相关联的信息，同时您也需要授权支付服务商向我们返回与您的交易有关的信息，包括订单信息、交易金额，下单时间、订单编号、订单状态、支付方式、支付流水号、支付状态。我们收集这些信息是为了帮助您顺利完成交易、保证您的交易安全、查询订单信息、提供客户服务等。</p>
        </div>
      </div>
      <div className="subsection flex flex-col gap-2">
        <h3>（四）开具发票</h3>
        <div className="flex flex-col gap-2 leading-5">
          <p className="leading-5">在您购买我们提供的付费服务后，您可能要求我们为您开具和寄送发票。我们仅提供电子发票，您需要向我们提供您的开票信息及电子邮箱地址。</p>
          <p className="leading-5">如您拒绝向我们提供前述信息，我们将无法协助您完成发票开具或送达。</p>
        </div>
      </div>
      <div className="subsection flex flex-col gap-2">
        <h3>（五）客服及争议处理</h3>
        <div className="flex flex-col gap-2 leading-5">
          <p className="leading-5">当您与我们联系或提出纠纷处理申请时，为了保障您的账户及系统安全，我们需要您提供必要的个人信息以核验您的身份。</p>
          <p className="leading-5">为便于与您联系、尽快帮助您解决问题或记录相关问题的处理方案及结果，我们会保存您与我们的沟通、通信/通话记录及相关内容，如果您针对具体订单进行咨询、投诉或提供建议的，我们会使用您的账户信息和订单信息。</p>
        </div>
      </div>
      <div className="subsection flex flex-col gap-2">
        <h3>（六）运营活动</h3>
        <div className="flex flex-col gap-2 leading-5">
          <p className="leading-5">我们可能不时举办运营活动，需要使用您的设备信息、网络信息、账号信息、头像、昵称、姓名、收货地址、位置信息、邮编、身份信息、手机号、银行或支付交易账号信息或其他可能需要您提供相关信息，用于活动报名、身份验证、权益发放等目的，具体以届时公布的活动规则为准。</p>
          <p className="leading-5">如运营活动涉及第三方向您提供权益，为了便于您领取具体权益，我们可能会将上述收集信息提供给第三方权益提供方，实际共享的信息以您参与具体的运营活动页面展示为准。为保障您领取实物权益，我们会向物流服务合作方提供您的收件人信息用于完成交付目的。</p>
        </div>
      </div>
      <div className="subsection flex flex-col gap-2">
        <h3>（七）互动交流</h3>
        <div className="flex flex-col gap-2 leading-5">
          <p className="leading-5">当您浏览内容、信息发布，或与其他用户进行互动交流的过程中，我们会记录您的点击、浏览、关注、点赞、反馈、分享、下载、发布等使用情况。</p>
          <p className="leading-5">如您在参与特定运营活动时与其他人进行分享、互动，我们会收集并展示好友关系、好友头像及昵称、互动人数、互动人头像。在告知并得到您的授权情况下，您的互动交流数据可能会被公开展示。</p>
          <p className="leading-5">如你分享或接收被分享的信息、参加活动需要复制或粘贴复制时，我们需要在本地访问你的剪切板，读取其中包含的口令、分享码、链接，以实现跳转、分享、活动联动等功能或服务。我们仅在本地识别出剪切板内容属于跳转、分享、活动联动等指令时才会将其上传我们的服务器。除此之外，我们不会上传你剪切板的其他信息至我们的服务器。如果您不同意或取消授权，您将不能使用剪贴板功能，但不影响您使用其他功能。</p>
        </div>
      </div>
      <div className="subsection flex flex-col gap-2">
        <h3>（八）保障运行安全所自动采集的个人信息</h3>
        <div className="flex flex-col gap-2 leading-5">
          <p className="leading-5">基于网络安全义务，我们在提供服务时有义务保存和向主管机关报告与网络安全事项相关的日志记录，因此我们将需记录并可能向主管机关提供您的账户信息，包括您的账户信息、实名认证提交的相关资料、操作时间、操作类型、网络源地址和目标地址、网络源端口、客户端硬件特征等日志信息以及您输入的信息等个人信息。</p>
          <p className="leading-5">为向您提供安全、可信的产品与使用环境，维护我们服务的正常运行，我们可能使用您的设备信息（如设备硬件序列号、设备MAC地址、唯一设备识别码如Android ID/OAID/IDFA/OPENUDID/GUID/SIM卡IMSI信息/MEID/ SUPI/SUCI等）、网络相关信息(如蓝牙、IP地址、网络运营营商、网络状态、类型、接入方式、网络质量数据等)以及设备参数信息(设备名称、设备型号)、软硬件操作系统信息(软件版本、操作系统、语言、分辨率)等用于身份验证、客户统计和服务、安全防范、诈骗监测等,以预防、发现、调查欺诈、危害网络安全、非法或违反与我们的协议、政策或规则的行为,以保护您、我们及社会公众的合法权益。</p>
        </div>
      </div>
      <div className="subsection flex flex-col gap-2">
        <h3>（九）移动互联网应用权限申请与使用情况说明</h3>
        <div className="flex flex-col gap-2 leading-5">
          <p className="leading-5">为保障智能体词元(Token)工场服务在移动互联网应用功能实现与安全稳定运行目的，我们可能会申请或使用操作系统的相关权限。我们通过《系统应用权限列表》将产品可能申请、使用的相关操作系统权限进行说明，以保障您的知情权。您可以根据实际需要对相关权限进行管理。</p>
          <p className="leading-5">根据移动互联网应用软件的升级，申请、使用权限的类型与目的可能会有变动，我们将及时根据这些变动对列表进行调整，以确保您及时获悉权限的申请与使用情况。</p>
        </div>
      </div>
    </section>
    <section className="terms-section mt-5">
      <div className="text-lg font-bold mb-2 leading-[26px]">二、我们如何使用cookie等同类技术</div>
      <div className="flex flex-col gap-2 leading-5">
        <p className="leading-5">Cookie和同类设备信息标识技术是互联网中普遍使用的技术。当您使用我们的服务时，我们可能会使用相关技术向您的设备发送一个或多个Cookie或匿名标识符(统称“Cookie”)，以收集、标识和储存您使用本服务时的信息。我们使用Cookies来存储诸如您的IP地址或其他标识符等信息，以及有关您查看并与我们的服务进行交互的内容的信息。通过存储此类信息，Cookies能够记住您对在线服务的偏好和设置，并分析您如何使用我们的服务，以使智能体词元(Token)工场服务更加便于用户使用。我们承诺不会将Cookie用于本隐私政策所述目的之外的任何其他用途。</p>
        <p className="leading-5">您可根据自己的偏好管理或删除Cookie。大多数浏览器均为用户提供了清除浏览器缓存数据的功能，您可以在浏览器设置中操作清除Cookie数据，但清除后可能无法使用由我们提供的依赖于Cookie的功能或服务。</p>
      </div>
    </section>
    <section className="terms-section mt-5">
      <div className="text-lg font-bold mb-2 leading-[26px]">三、我们如何委托处理、共享、转让、公开披露个人信息</div>
      <div className="subsection flex flex-col gap-2">
        <h3>（一）委托处理</h3>
        <div className="flex flex-col gap-2 leading-5">
          <p className="leading-5">智能体词元(Token)工场服务中某些具体功能的实现需要委托第三方合作伙伴来协助我们提供技术支持，我们仅提供必要的个人信息委托第三方合作伙伴处理。对我们委托处理个人信息的公司、组织和个人，我们会与其签署严格的保密协议，要求他们按照我们的要求、本隐私政策以及其他任何相关的保密和安全措施来处理个人信息。</p>
        </div>
      </div>
      <div className="subsection flex flex-col gap-2">
        <h3>（二）共享</h3>
        <div className="flex flex-col gap-2 leading-5">
          <p className="leading-5">我们不会与我们服务提供商以外的公司、组织和个人共享个人信息，但以下情况除外：</p>
          <p className="leading-5">1、我们将您的信息与我们公司集团内的关联公司和实体共享，用于内部管理、运营支持以及履行我们对您的合同义务。有效地管理我们的业务和提供无缝的服务符合我们的合法利益。</p>
          <p className="leading-5">2、在获取明确同意的情况下共享：获得您的明确同意后，我们会与其他方共享您的信息。</p>
          <p className="leading-5">3、在法定情形下的共享：我们可能会根据法律法规规定、诉讼争议解决需要，或按行政、司法机关依法提出的要求，对外共享您的信息。</p>
          <p className="leading-5">4、为履行您作为一方当事人的合同所需的共享：您通过智能体词元(Token)工场服务订购的或者由第三方服务商提供的产品及或服务，我们会根据您选择的服务项目，将您的必要个人信息提供给相关产品及或服务的提供者，以实现您的交易及售后服务需求。</p>
          <p className="leading-5">5、与授权合作伙伴共享：仅为实现本隐私政策中声明的目的，我们的某些产品及或服务将由我们和授权合作伙伴共同提供。我们仅会出于合法、正当、必要、特定、明确的目的共享您的信息，并且只会基于“一、我们如何收集和使用个人信息”中所述目的，共享提供产品或服务所必要的个人信息。我们的合作伙伴无权将共享的个人信息用于与产品及或服务无关的其他用途。我们会对授权合作伙伴获取个人信息的应用程序接口（API）、软件工具开发包（SDK）进行严格的安全检测，并与授权合作伙伴约定严格的数据安全保护措施。您理解第三方服务由独立供应商运营，受其自身隐私政策约束。我们虽会尽力进行安全检测，但无法对第三方的合规性及安全性做出法律上的保证或连带责任承诺。如因第三方行为造成您损失，我们将尽力协助您维护合法权益。</p>
        </div>
      </div>
      <div className="subsection flex flex-col gap-2">
        <h3>（三）转让</h3>
        <div className="flex flex-col gap-2 leading-5">
          <p className="leading-5">我们不会将您的个人信息转让给任何公司、组织和个人，但以下情况除外：</p>
          <p className="leading-5">1、事先获得您明确的同意或授权；</p>
          <p className="leading-5">2、根据适用的法律法规、法律程序的要求、强制性的行政或司法要求所必须的情况进行提供；</p>
          <p className="leading-5">3、在涉及合并、收购、资产转让或类似的交易时，如涉及到个人信息转让，我们会要求新的持有您个人信息的公司、组织继续受本隐私政策的约束，否则，我们将要求该公司、组织重新向您征求授权同意。</p>
        </div>
      </div>
      <div className="subsection flex flex-col gap-2">
        <h3>（四）公开披露</h3>
        <div className="flex flex-col gap-2 leading-5">
          <p className="leading-5">我们仅会在以下情况下，公开披露个人信息：</p>
          <p className="leading-5">1、获得您明确同意或基于您的主动选择，我们可能会公开披露您的信息；</p>
          <p className="leading-5">2、如果我们确定您出现违反法律法规或严重违反本隐私政策、平台规则的情况，或为保护我们及其他用户、公众的人身财产安全免遭侵害，我们在法律、法律程序、诉讼或政府主管部门强制性要求的情况下，可能会公开披露您的信息。</p>
        </div>
      </div>
    </section>
    <section className="terms-section mt-5">
      <div className="text-lg font-bold mb-2 leading-[26px]">四、我们如何保护个人信息</div>
      <div className="subsection flex flex-col gap-2">
        <h3>（一）我们已采取符合业界标准、合理可行的安全防护措施保护个人信息安全，防止个人信息遭到未经授权访问、公开披露、使用、修改、损坏或丢失。我们会使用加密技术提高个人信息的安全性；我们会使用受信赖的保护机制防止个人信息遭到恶意攻击；我们会部署访问控制机制，尽力确保只有授权人员才可访问个人信息；以及我们会举办安全和隐私保护培训课程，加强员工对于保护个人信息重要性的认识。</h3>
        <div className="flex flex-col gap-2 leading-5">
        </div>
      </div>
      <div className="subsection flex flex-col gap-2">
        <h3>（二）我们有行业先进的以数据为核心，围绕数据生命周期进行的数据安全管理体系，从组织建设、制度设计、人员管理、产品技术等方面多维度提升智能体词元(Token)工场服务的安全性。</h3>
        <div className="flex flex-col gap-2 leading-5">
        </div>
      </div>
      <div className="subsection flex flex-col gap-2">
        <h3>（三）我们会采取合理可行的措施，尽力避免收集无关的个人信息。我们只会在达成本隐私政策所述目的所需的期限内保留个人信息，除非法律有强制的保留要求。而我们判断前述存储期限的标准包括：</h3>
        <div className="flex flex-col gap-2 leading-5">
          <p className="leading-5">1、完成与您相关的产品及服务使用目的、维护相应业务记录、应对您可能的查询或投诉；</p>
          <p className="leading-5">2、保证我们为您提供产品及或服务的安全和质量；</p>
          <p className="leading-5">3、您是否同意更长的留存期间；</p>
          <p className="leading-5">4、是否存在保留期限的其他特别约定。</p>
          <p className="leading-5">在个人信息超出存储期间后，我们会根据适用法律的要求删除个人信息，或使其匿名化处理。</p>
        </div>
      </div>
      <div className="subsection flex flex-col gap-2">
        <h3>（四）互联网并非绝对安全的环境，我们强烈建议您不要使用非我们推荐的通信方式发送个人信息。我们的服务可能包含链接到不由我们运营的其他网站。如果您点击第三方链接，您将被引导到该第三方的网站。我们建议您查看您访问的每个网站的隐私政策，谨慎判断第三方的身份，自主决定向其沟通、交易或分享的内容。请您妥善保护自己的信息，仅在必要的情形下向第三方提供。</h3>
        <div className="flex flex-col gap-2 leading-5">
        </div>
      </div>
      <div className="subsection flex flex-col gap-2">
        <h3>（五）在不幸发生个人信息安全事件后，我们将按照法律法规的要求向您告知：安全事件的基本情况和可能的影响、我们已采取或将要采取的处置措施、您可自主防范和降低风险的建议、对您的补救措施等。事件相关情况我们将以邮件、信函、电话、推送通知等方式告知您，难以逐一告知用户时，我们会采取合理、有效的方式发布公告。同时，我们还将按照监管部门要求，上报个人信息安全事件的处置情况。</h3>
        <div className="flex flex-col gap-2 leading-5">
        </div>
      </div>
    </section>
    <section className="terms-section mt-5">
      <div className="text-lg font-bold mb-2 leading-[26px]">五、您如何管理个人信息</div>
      <div className="flex flex-col gap-2 leading-5">
        <p className="leading-5">您可以通过以下方式访问及管理您的信息：</p>
      </div>
      <div className="subsection flex flex-col gap-2">
        <h3>（一）访问您的信息</h3>
        <div className="flex flex-col gap-2 leading-5">
          <p className="leading-5">您有权访问您的信息，法律法规规定的例外情况除外。您可以通过以下方式自行访问您的信息：</p>
          <p className="leading-5">账号信息：您可以通过登录智能体词元(Token)工场产品的“个人资料”进行账号中的个人信息访问。</p>
          <p className="leading-5">如您有其他需求，或您无法通过上述路径访问该等个人信息，请通过第九条列明的联系方式联系我们处理，我们将在15个工作日内回复您的访问请求。</p>
          <p className="leading-5">对于您在使用我们的产品及或服务过程中产生的其他信息，我们将根据本条“（九）响应您的上述请求”中的相关安排向您提供。</p>
        </div>
      </div>
      <div className="subsection flex flex-col gap-2">
        <h3>（二）更正或补充您的信息</h3>
        <div className="flex flex-col gap-2 leading-5">
          <p className="leading-5">您应确保提交的所有个人信息都准确无误。我们会尽力维护您的个人信息的准确和完整，并基于您向我们提供的信息及时更新您的个人信息。</p>
          <p className="leading-5">当您发现我们处理的关于您的信息有错误时，您有权要求我们做出更正或补充。请通过第九条列明的联系方式联系我们处理，我们将在15个工作日内回复您的请求。</p>
          <p className="leading-5">若我们有合理理由怀疑您提供的资料存在错误、不完整、不真实等情况，我们有权向您询问或通知您改正，甚至暂停或中止对您提供部分服务。</p>
        </div>
      </div>
      <div className="subsection flex flex-col gap-2">
        <h3>（三）删除您的信息</h3>
        <div className="flex flex-col gap-2 leading-5">
          <p className="leading-5">在以下情形中，您可以向我们提出删除信息的请求：</p>
          <p className="leading-5">1、如果我们处理信息的行为违反法律法规；</p>
          <p className="leading-5">2、如果我们收集、使用您的信息，却未征得您的明确同意；</p>
          <p className="leading-5">3、如果我们处理信息的行为严重违反了与您的约定；</p>
          <p className="leading-5">4、如果您不再使用我们的产品及或服务，或您主动注销了账号；</p>
          <p className="leading-5">5、如果我们永久不再为您提供产品及或服务。</p>
          <p className="leading-5">您可以通过本隐私政策第九条披露的联系方式联系我们删除。若我们决定响应您的删除请求，我们还将同时尽可能通知从我们处获得您的信息的第三方，要求其及时删除，除非法律法规另有规定，或这些第三方获得您的独立授权。</p>
          <p className="leading-5">当您或我们协助您删除相关信息后，因为适用的法律和安全技术，我们可能无法立即从备份系统中删除相应的信息，我们将安全地存储您的信息并将其与任何进一步处理隔离，直到备份可以清除或实现匿名。</p>
        </div>
      </div>
      <div className="subsection flex flex-col gap-2">
        <h3>（四）改变您授权同意的范围</h3>
        <div className="flex flex-col gap-2 leading-5">
          <p className="leading-5">智能体词元(Token)工场服务中的每个业务功能可能需要一些额外的个人信息才能得以完成。对于额外个人信息的收集和使用，您可以通过本隐私政策第九条披露的联系方式联系我们撤回您对此类个人信息使用的部分或全部同意。</p>
          <p className="leading-5">如您申请注销您的账户的同时，将视同您撤回了对本隐私政策全部内容的同意。当您收回同意后，我们将不再处理相应的个人信息。</p>
          <p className="leading-5">您可以通过更改设备权限设置选项，改变您对我们通过设备权限处理您的个人信息的授权同意的范围。</p>
          <p className="leading-5">请您注意，您撤回同意的决定，不会影响此前基于您的授权而开展的个人信息处理。</p>
        </div>
      </div>
      <div className="subsection flex flex-col gap-2">
        <h3>（五）用户注销账号</h3>
        <div className="flex flex-col gap-2 leading-5">
          <p className="leading-5">请您通过本隐私政策第九条披露的联系方式联系我们申请关闭/注销您的账户。我们收到您的账号注销申请后，将在15个工作日内完成核查与处理。在您主动注销账户之后，我们将停止为您提供产品或服务，并根据适用法律的要求删除您的个人信息，或对其进行匿名化处理。</p>
          <p className="leading-5">关于账号注销，如您有任何疑问，可以通过本隐私政策第九条披露的联系方式联系我们。</p>
        </div>
      </div>
      <div className="subsection flex flex-col gap-2">
        <h3>（六）获取个人信息副本及转移您的个人信息</h3>
        <div className="flex flex-col gap-2 leading-5">
          <p className="leading-5">您有权获取您的信息副本，您可以通过本隐私政策第九条披露的联系方式联系我们处理。我们在技术可行的前提下，我们会提供关于您个人信息的标准格式的可读文本。</p>
        </div>
      </div>
      <div className="subsection flex flex-col gap-2">
        <h3>（七）约束信息系统自动决策</h3>
        <div className="flex flex-col gap-2 leading-5">
          <p className="leading-5">如我们对您进行自动决策时，我们将为您提供不以您的特征为目标的选项。我们将确保决策的透明度和结果的公平性和公正性，不会在交易价格和交易条件方面对个人施加不合理的歧视性待遇。</p>
        </div>
      </div>
      <div className="subsection flex flex-col gap-2">
        <h3>（八）响应您的上述请求</h3>
        <div className="flex flex-col gap-2 leading-5">
          <p className="leading-5">为保障安全，您可能需要提供书面请求，或以其他方式证明您的身份。我们可能会先要求您验证自己的身份，然后再处理您的请求。</p>
          <p className="leading-5">对于您行使个人信息主体权利的任何请求，我们将在15个工作日内做出答复。如您不满意，还可以通过本隐私政策第九条披露的联系方式向我们要求解决。</p>
          <p className="leading-5">对于您合理的请求，我们原则上不收取费用，但对多次重复、超出合理限度的请求，我们将视情收取一定成本费用。对于那些无端重复、需要过多技术手段（例如，需要开发新系统或从根本上改变现行惯例）、给他人合法权益带来风险或者非常不切实际的请求，我们可能会予以拒绝。但按照有关法律法规规定，我们将无法响应您的请求除外。</p>
        </div>
      </div>
    </section>
    <section className="terms-section mt-5">
      <div className="text-lg font-bold mb-2 leading-[26px]">六、我们如何处理儿童的个人信息</div>
      <div className="flex flex-col gap-2 leading-5">
        <p className="leading-5">我们非常重视对儿童个人信息的保护。我们不接受任何儿童创建智能体词元(Token)工场产品账户。如果我们发现我们无意中收集了儿童的个人信息，我们会设法尽快删除相关数据。</p>
      </div>
    </section>
    <section className="terms-section mt-5">
      <div className="text-lg font-bold mb-2 leading-[26px]">七、个人信息如何存储和在全球范围转移</div>
      <div className="flex flex-col gap-2 leading-5">
        <p className="leading-5">我们在运营中收集和产生的个人信息，将存储在中国境内服务器中，使用我们的服务即表示您对其理解并承认，我们将采取所有必要措施，以确保根据适用数据保护法律保护您的个人数据。</p>
        <p className="leading-5">一般而言，除非法律另有规定，我们仅在业务所需的最短时间内保留。针对已去标识化或匿名化的数据，我们有权进行无限期存储及商业化利用。如果我们终止服务或运营，我们会提前将停止运营的通知以送达或公告的形式通知您，并在终止服务或运营后合理的期限内删除您的个人信息或进行匿名化处理；如果您注销账号、主动删除个人信息或超出必要的期限后，我们将对您的个人信息进行删除或匿名化处理，但遵从法律法规有关信息留存的要求或出于财务、审计、争议解决等目的需要合理延长期限的除外。</p>
      </div>
    </section>
    <section className="terms-section mt-5">
      <div className="text-lg font-bold mb-2 leading-[26px]">八、本隐私政策如何更新</div>
      <div className="flex flex-col gap-2 leading-5">
        <p className="leading-5">我们的隐私政策可能变更。未经您明确同意，我们不会限制您按照本隐私政策所应享有的权利。我们会在智能体词元(Token)工场产品上发布对隐私政策所做的任何变更。</p>
        <p className="leading-5">对于重大变更，我们还会提供更为显著的通知（包括我们会通过我们公示的方式进行意见征集、公告通知甚至向您提供弹窗提示）。</p>
        <p className="leading-5">本隐私政策所指的重大变更包括但不限于：</p>
        <p className="leading-5">1、我们的产品及或服务模式发生重大变化。如处理个人信息的目的、处理的个人信息类型、个人信息的使用方式等；</p>
        <p className="leading-5">2、我们在控制权等方面发生重大变化。如并购重组等引起的信息控制者变更等；</p>
        <p className="leading-5">3、个人信息共享、转让或公开披露的主要对象发生变化；</p>
        <p className="leading-5">4、您参与个人信息处理方面的权利及其行使方式发生重大变化；</p>
        <p className="leading-5">5、我们负责处理个人信息安全的责任部门、联络方式及投诉渠道发生变化；</p>
        <p className="leading-5">6、个人信息安全影响评估报告表明存在高风险。</p>
      </div>
    </section>
    <section className="terms-section mt-5">
      <div className="text-lg font-bold mb-2 leading-[26px]">九、如何联系我们</div>
      <div className="flex flex-col gap-2 leading-5">
        <p className="leading-5">我们设有专门法务合规部门监督个人信息保护事宜，有关本隐私政策或我们的隐私措施相关问题可通过如下方式联系我们，我们将在15个工作日内回复您的请求：</p>
        <p className="leading-5">【contact@huizhihuyu.com】</p>
        <p className="leading-5">如果您对我们的回复不满意，特别是您认为我们的个人信息处理行为损害了您的合法权益，您还可以提交至南京仲裁委员会，按照其届时有效的仲裁规则进行仲裁。仲裁裁决是终局的。</p>
      </div>
    </section>
  </div>
);
