import json, pathlib, tempfile, unittest
from publish import assemble, version_key

class PublishingTests(unittest.TestCase):
    def test_versions_are_semantic(self):
        self.assertGreater(version_key('0.10.0'), version_key('0.9.0'))
        self.assertGreater(version_key('0.5.0'), version_key('0.5.0-preview.1'))
        self.assertGreater(version_key('0.5.0-preview.10'), version_key('0.5.0-preview.2'))
        with self.assertRaises(ValueError): version_key('../main')

    def test_versions_are_laid_out_under_the_site_root(self):
        with tempfile.TemporaryDirectory() as directory:
            root = pathlib.Path(directory)
            next_site = root / 'next'; next_site.mkdir(); (next_site / 'index.html').write_text('next')
            releases = root / 'releases'; releases.mkdir()
            for version, preview in [('0.5.0', False), ('0.6.0-preview.1', True)]:
                p = releases / version; (p / 'agents').mkdir(parents=True); (p / 'index.html').write_text(version)
                (p / '404.html').write_text('missing ' + version)
                (p / 'release.json').write_text(json.dumps({'version': version, 'prerelease': preview}))
                (p / 'agents/provenance.json').write_text(json.dumps({'version': version}))
            out = root / 'out'
            assemble(next_site, releases, out, prefix='/docs')
            manifest = json.loads((out / 'versions.json').read_text())
            self.assertEqual(manifest['stable'], '0.5.0')
            self.assertEqual([v['id'] for v in manifest['versions']], ['0.6.0-preview.1', '0.5.0', 'next'])
            self.assertIn('/docs/0.5.0/', (out / 'index.html').read_text())
            self.assertEqual((out / '404.html').read_text(), 'missing 0.5.0')
            self.assertEqual((out / 'next/index.html').read_text(), 'next')
            with self.assertRaises(ValueError): assemble(next_site, releases, out)
            with self.assertRaises(ValueError): assemble(next_site, releases, root / 'too-large', budget=1)

if __name__ == '__main__': unittest.main()
