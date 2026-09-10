# 两个招募入口

## 入口与语言

- Prolific 版：`index.html`，保留平台 ID、巴塞罗那居住筛选及平台返回流程。
- 自招版：`local.html`，无需 Prolific 账号，不显示平台完成码或跳转，只说明自愿参与，不提报酬。
- 两版均可切换西班牙语、加泰罗尼亚语、英语，使用相同的 50 个场景、实验分组、图片呈现、随机化和 attention checks。
- 本地打开这两个 HTML 文件只作预览，不上传。部署后，两版使用同一个 Netlify 表单 `facade_pairwise_data`。

## 人口信息

人口问题位于全部图片评分之后，避免先问专业背景而影响图片判断。所有问题均可留空或选择不回答，不据此筛除参与者。

| 指标 | Prolific 版 | 自招版 |
| --- | --- | --- |
| 年龄 | 平台导出，分析时转为年龄段 | 18-24、25-34、35-44、45-54、55-64、65+ |
| 性别认同 | 问卷询问 | 相同问题 |
| 最高已完成学历 | 提前选用学历 prescreener，随后导出 | 问卷询问 |
| 建筑、城市设计、规划或景观专业背景 | 问卷询问 | 相同问题 |
| 在巴塞罗那市累计居住时长 | 问卷询问 | 相同问题 |

Prolific 默认导出的 `Sex` 与此处的性别认同不是同一个指标，不能直接合并。此前伦理文件对 sex 变量的建议仍需研究团队核对，不可用改字段名代替核对。

Prolific 的年龄、学历不会自动进入 Netlify；完成招募后下载 demographic data，以 `Participant ID` 对应问卷 `prolific_pid` 关联。学历筛选须在发布前设置，并按招募计划选全需要的类别。实际导出类别核对后再映射，保留原值与数据来源；不能从现有问卷记录推算缺失学历。

当前显示时长为约 9-13 分钟，这是加入人口问题后的规划估计，并非实测。两版分别小规模试填后再确定正式时长。

## 自招分发

正式自招使用每人一个独立邀请链接，其中包含 `LOCAL_ID` 和 `BLOCK_ID`。不要让多人共用同一邀请链接，也不要将整张邀请清单公开。独立编号也适用于多人轮流使用同一台电脑的情形。

在问卷仓库目录运行以下命令，替换输出路径为仓库外的私有目录：

```powershell
node tools/make-local-invitations.mjs C:\PRIVATE\local-invitations.json 4
```

输出 JSON 清单及可点击的 Markdown 清单，默认共 100 条，25 组各 4 条。它们不是必须全部使用的名额；先覆盖全部 25 组，再根据实际完成情况补充。若计划每组 1 位 Prolific 加 3 位自招，则末尾参数使用 `3`，生成 75 条自招邀请。每次生成都会产生新编号，已分发的清单必须保留。

不带编号的 `local.html?LANG=es` 可用于看效果和技术测试，正式模式会要求完整个人邀请链接。静态网站不提供服务器名额锁或真正的一次性令牌验证；编号支持恢复和分析去重，但无法识别同一自然人换编号或跨来源重复参加。需在私有招募记录中管理，联系信息与评分分开保存。不要把邀请清单、响应数据或联系人记录上传 GitHub。

## 查看数据

在 Netlify 的 `Forms > facade_pairwise_data` 查看，必要时也检查 Spam。新增表单字段 `recruitment_source` 区分 `prolific` 与 `local`，`participant_id` 是通用编号。自招记录的 `prolific_pid` 留空，不伪造平台 ID。

人口答案在 `payload_json` 和 `payload_csv`。未回答、明确不愿回答、未到达人口页面、等待平台导出分别记录为 `not_answered`、`prefer_not_to_answer`、`not_collected`、`external_pending`，不会混作零分。

完整自招问卷通常为 26 条记录，Prolific 为 27 条；两者都有 10 条 PAD 和 5 条 preference。筛选退出分别为 3 条、4 条，没有图片评分或人口答案。以 `outcome`、`record_type` 及题目内容检查完整性，不只看条数。

```powershell
node tools/coverage-report.mjs C:\PRIVATE\responses
node tools/participant-report.mjs C:\PRIVATE\responses C:\PRIVATE\participants.json
node tools/prepare-preference.mjs C:\PRIVATE\responses C:\PRIVATE\preference-input.json
```

覆盖报告会分别统计两种来源的人数和各组有效完成数；人口导出按人汇总。分析保留招募来源，不将便利样本描述成全市居民的代表性样本。

## 发布前

两版当前仍为 `upload_test`。`study_config.js` 中 `mode` 控制 Prolific，`localMode` 控制自招，互不代替。修改入口不等于批准正式研究，已有研究确认项没有被自动解锁。

将两个 HTML 文件、共享脚本及新增 `demographics.js` 一起推送并部署到 Netlify。各入口至少验证一份完整测试、一份筛选退出，检查后台实际 JSON 与 CSV。测试记录标记为 `test_submission=true`，不会被纳入正式分析。研究团队核对新增人口问题及自招安排、实际收集端完成验证后，才将对应入口切换为正式模式。
