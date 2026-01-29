# ✅ YAZILIM PROD CHECKLIST

*(Junior’dan Senior’a herkes için)*

---

## 1️⃣ Veri Tabanı & ORM

* [ ] **N+1 query** var mı? (liste + iç sorgu)
* [ ] Gereksiz **SELECT *** kullanımı yok mu?
* [ ] Sık kullanılan sorgular için **doğru index** var mı?
* [ ] Composite index gerekiyor mu?
* [ ] Pagination **OFFSET** ile mi? (büyük tabloda tehlikeli)
* [ ] Keyset pagination doğru mu?
* [ ] Soft delete (`deleted_at`) filtreleniyor mu?
* [ ] Transaction sınırları net mi?
* [ ] Deadlock ihtimali var mı?
* [ ] Connection pool leak riski var mı?
* [ ] Migration + uygulama uyumu test edildi mi?
* [ ] UTC / timezone tutarlı mı?

---

## 2️⃣ Performans

* [ ] N² döngü var mı?
* [ ] Gereksiz object clone/kopya var mı?
* [ ] Büyük payload (JSON/media) küçültülebilir mi?
* [ ] Senkron I/O request içinde mi?
* [ ] Cache gerçekten işe yarıyor mu?
* [ ] Hot-key riski var mı?
* [ ] Cache TTL mantıklı mı?
* [ ] Cache invalidation doğru çalışıyor mu?
* [ ] Profiling yapılmadan optimize edildi mi? ❌

---

## 3️⃣ Cache & Tutarlılık

* [ ] Cache stampede riski var mı?
* [ ] Cache + DB arasında race condition var mı?
* [ ] Cache yazma/okuma sırası doğru mu?
* [ ] Distributed cache inconsistency mümkün mü?
* [ ] Stale data kullanıcıyı etkiler mi?

---

## 4️⃣ Concurrency & Paralellik

* [ ] Aynı kayıt aynı anda güncellenebilir mi?
* [ ] Race condition ihtimali var mı?
* [ ] Atomic olmayan işlem var mı?
* [ ] Double submit (iki kez tıklama) engellendi mi?
* [ ] Idempotency key var mı?
* [ ] Lock süresi doğru ayarlanmış mı?
* [ ] Deadlock sırası tutarlı mı?

---

## 5️⃣ Dağıtık Sistem

* [ ] Timeout tanımlı mı?
* [ ] Retry var mı ama **limitli mi**?
* [ ] Retry + backoff + jitter var mı?
* [ ] Circuit breaker var mı?
* [ ] Servis bağımlılığı koparsa ne olur?
* [ ] Event sırası bozulursa sistem ayakta kalır mı?
* [ ] At-least-once mesajı iki kez işleyebilir mi?

---

## 6️⃣ API Tasarımı

* [ ] HTTP status code’lar doğru mu?
* [ ] Validation her girişte var mı?
* [ ] Error formatı tutarlı mı?
* [ ] Breaking change yaptın mı?
* [ ] API versioning var mı?
* [ ] Pagination contract net mi?
* [ ] Rate limit var mı?
* [ ] CORS bilinçli mi ayarlı?
* [ ] Webhook signature doğrulanıyor mu?

---

## 7️⃣ Güvenlik (KRİTİK)

* [ ] SQL / NoSQL injection kapalı mı?
* [ ] XSS escape var mı?
* [ ] CSRF korunuyor mu?
* [ ] AuthN ve AuthZ ayrılmış mı?
* [ ] IDOR riski var mı?
* [ ] JWT expiry / refresh doğru mu?
* [ ] Secret’lar koda gömülü mü? ❌
* [ ] Log’larda token/PII var mı? ❌
* [ ] Rate limit brute-force’u engelliyor mu?
* [ ] File upload MIME + size kontrolü var mı?

---

## 8️⃣ Frontend / Mobil

* [ ] Double-click / multi-submit engelli mi?
* [ ] Loading / error / empty state var mı?
* [ ] Offline senaryosu düşünüldü mü?
* [ ] State tek kaynaktan mı?
* [ ] Memory leak (listener/timer) var mı?
* [ ] List virtualized mı?
* [ ] Permission flow sağlam mı?
* [ ] Accessibility tamamen unutuldu mu? ❌

---

## 9️⃣ Ödeme / Kritik İş Akışları

* [ ] Idempotency zorunlu mu?
* [ ] Webhook iki kez gelirse ne olur?
* [ ] Yetki client’a mı güveniyor?
* [ ] Refund / rollback akışı var mı?
* [ ] Entitlement cache stale olabilir mi?
* [ ] Retry ücret keser mi?

---

## 🔟 Test & Release

* [ ] Unit + integration test var mı?
* [ ] E2E kritik akışlar test edildi mi?
* [ ] Flaky test var mı?
* [ ] Feature flag ile deploy edildi mi?
* [ ] Rollback planı hazır mı?
* [ ] Prod ile stage config aynı mı?
* [ ] Migration + uygulama uyumu test edildi mi?
* [ ] Healthcheck doğru çalışıyor mu?

---

## 1️⃣1️⃣ Loglama & İzleme

* [ ] Exception yutuluyor mu?
* [ ] Log seviyeleri doğru mu?
* [ ] Correlation ID var mı?
* [ ] Metric (latency, error rate) var mı?
* [ ] Alert’ler gerçekten anlamlı mı?
* [ ] Alarm fırtınası var mı?

---

## 🧠 ALTIN KURAL

> **“Bunu aynı anda 1000 kişi yaparsa ne olur?”**
> **“Bu iki kez çalışırsa ne olur?”**
> **“Bu yarıda kalırsa sistem ne yapar?”**

Bu üç soruya net cevap yoksa → **bug vardır**.
