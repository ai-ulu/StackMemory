# ✅ YAZILIM PROD CHECKLIST

*(Junior’dan Senior’a herkes için)*

---

## 1️⃣ Veri Tabanı & ORM

* [ ] **N+1 query** var mı? (liste + iç sorgu)
* [ ] Gereksiz **SELECT *** kullanımı yok mu?
* [ ] Sık kullanılan sorgular için **doğru index** var mı?
* [ ] Composite index gerekiyor mu?
* [ ] Pagination **OFFSET** ile mi? (büyük tabloda tehlikeli) -> Cursor-based pagination için **ORDER BY unique** mi?
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
* [ ] Cache invalidation doğru çalışıyor mu? -> **Cache warming** stratejisi var mı?
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
* [ ] Circuit breaker var mı? -> **Half-open state** test edildi mi?
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
* [ ] Flaky test var mı? -> Test data isolation (her test kendi verisini mi oluşturuyor?)
* [ ] Feature flag ile deploy edildi mi? -> Flag cleanup (tech debt) planı var mı?
* [ ] Rollback planı hazır mı?
* [ ] Prod ile stage config aynı mı?
* [ ] Migration sırası doğru mu?
* [ ] Healthcheck doğru çalışıyor mu? -> **Liveness vs Readiness probe** ayrımı net mi?

---

## 1️⃣1️⃣ Loglama & İzleme

* [ ] Exception yutuluyor mu?
* [ ] Log seviyeleri doğru mu?
* [ ] Correlation ID var mı?
* [ ] Metric (latency, error rate) var mı?
* [ ] Alert’ler gerçekten anlamlı mı?
* [ ] Alarm fırtınası var mı?

---

## 1️⃣2️⃣ Infrastructure & DevOps

* [ ] Container image'ları tarandı mı? (Trivy/Snyk)
* [ ] Pod security context (non-root, read-only FS) ayarlı mı?
* [ ] Resource limit (CPU/memory) tanımlı mı?
* [ ] HPA/VPA cluster kapasitesini aşar mı?
* [ ] Secrets rotation mekanizması var mı?
* [ ] ConfigMap/Secret değişince hot-reload oluyor mu?
* [ ] Blue-green veya canary deployment var mı?
* [ ] Infrastructure as Code (IaC) drift kontrolü var mı?

---

## 1️⃣3️⃣ Veri Yönetimi & Compliance

* [ ] PII (Kişisel Veri) masking/anonymization var mı?
* [ ] GDPR/KVKK "right to be forgotten" implemente edildi mi?
* [ ] Veri saklama süresi (retention policy) otomatik mi?
* [ ] Cross-region veri replikasyonu yasal mı?
* [ ] Backup şifreli mi ve restore test edildi mi?
* [ ] RTO/RPO hedefleri tanımlı mı?

---

## 1️⃣4️⃣ API & Entegrasyon İleri Seviye

* [ ] API deprecation takvimi ve sunset policy var mı?
* [ ] OpenAPI/Swagger dokümantasyonu güncel mi?
* [ ] Idempotency key TTL'si yeterli mi?
* [ ] GraphQL query depth/complexity limiti var mı?
* [ ] Webhook retry exponential backoff doğru mu?
* [ ] Third-party API rate limit'leri cache'leniyor mu?

---

## 1️⃣5️⃣ Maliyet & Optimizasyon

* [ ] Cloud resource tagging (cost center) yapılmış mı?
* [ ] Unused resource (EIP, disk, snapshot) temizliği var mı?
* [ ] Data transfer cost (cross-AZ/region) optimize edildi mi?
* [ ] Log retention gereksiz uzun mu?
* [ ] Auto-shutdown (dev/test ortamları) var mı?

---

## 1️⃣6️⃣ Güvenlik Derinlemesine

* [ ] Dependency confusion attack önlemi var mı? (private registry)
* [ ] SAST/DAST scan pipeline'da var mı?
* [ ] Secrets git history'den temizlendi mi? (git-leaks)
* [ ] Container runtime security (Falco/Sysdig) var mı?
* [ ] Network policy (pod-to-pod) kısıtlı mı?
* [ ] Supply chain security (SBOM oluşturuluyor mu?)

---

## 💡 "Sinsice" Eksikler (Çoğu Proje Atlar)

* [ ] **Chaos Engineering:** "Bir pod'u öldürünce ne olur?" testi yapıldı mı?
* [ ] **Data Integrity:** Checksum/hash ile veri bütünlüğü kontrolü var mı?
* [ ] **Clock Skew:** Distributed sistemlerde zaman senkronizasyonu (NTP) problemi var mı?
* [ ] **Thundering Herd:** Cache miss anında DB'ye yığılma önlendi mi?
* [ ] **Retry Storm:** Bir servis down olduğunda diğerleri onu retry ile mi bombalıyor?

---

## 🧠 ALTIN KURAL

> **“Bunu aynı anda 1000 kişi yaparsa ne olur?”**
> **“Bu iki kez çalışırsa ne olur?”**
> **“Bu yarıda kalırsa sistem ne yapar?”**

Bu üç soruya net cevap yoksa → **bug vardır**.
