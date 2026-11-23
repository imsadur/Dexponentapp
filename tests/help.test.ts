import assert from "node:assert/strict";
import test from "node:test";
import {
  articleById,
  articlesIn,
  assistantReply,
  helpArticles,
  helpCategories,
  popularIssues,
  searchArticles,
  supportMailto,
} from "../src/domain/help";

test("every category has articles and every article has a known category", () => {
  for (const category of helpCategories) assert.ok(articlesIn(category.id).length > 0, category.id);
  const ids = new Set(helpCategories.map((c) => c.id));
  for (const article of helpArticles) assert.ok(ids.has(article.category), article.id);
});

test("article ids are unique and popular issues resolve", () => {
  assert.equal(new Set(helpArticles.map((a) => a.id)).size, helpArticles.length);
  for (const issue of popularIssues) assert.ok(articleById(issue.articleId), issue.label);
});

test("popular issue chips answer with their own article", () => {
  for (const issue of popularIssues) assert.equal(assistantReply(issue.label).article?.id, issue.articleId, issue.label);
});

test("assistant matches natural questions and ignores filler words", () => {
  assert.equal(assistantReply("why was I liquidated?").article?.id, "leverage-liquidation");
  assert.equal(assistantReply("my deposit hasn't arrived").article?.id, "deposit-pending");
  assert.ok(!assistantReply("why was I liquidated?").related.some((a) => a.category === "account"));
});

test("unknown questions fall back without an answer", () => {
  const reply = assistantReply("asdfgh qwerty");
  assert.equal(reply.article, undefined);
  assert.deepEqual(searchArticles("   "), []);
});

test("support mailto targets support with an encoded subject", () => {
  assert.equal(supportMailto("Help: fees & gas"), "mailto:support@dexponent.com?subject=Help%3A%20fees%20%26%20gas");
});
